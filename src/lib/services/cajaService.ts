import { supabase } from '@/lib/supabase';
import { ComandaService, ComandaComplete } from './comandaService';
import { BatchService } from './batchService';
import { RecipeService } from './recipeService';
import { StockService } from './inventoryService';
import { SriIntegrationService } from './sriIntegrationService';
import { FiscalService } from './fiscalService';

export interface EstadisticasCaja {
  totalVentas: number;
  comandasCerradas: number;
  ingresosEfectivo: number;
  ingresosTarjeta: number;
  ingresosTransferencia: number;
  totalIngresos: number;
}

export interface TicketVenta {
  ticketNumber: string;
  comandaId: string;
  tableNumber: string;
  employeeName: string;
  items: Array<{
    dish_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  subtotal: number;
  impuestos: number;
  total: number;
  paymentMethod: string;
  fecha: string;
}

export class CajaService {
  /**
   * Obtener comandas servidas pendientes de cierre
   */
  static async getComandasServidas(): Promise<{ data: ComandaComplete[] | null; error: any }> {
    return ComandaService.getComandasServidas();
  }

  /**
   * Validar stock disponible para una comanda
   */
  static async validarStockDisponible(comandaId: string): Promise<{ success: boolean; error?: string; faltantes: Array<{ item: string; faltante: number }> }> {
    try {
      const { data: comanda, error: comandaError } = await ComandaService.getById(comandaId);
      
      if (comandaError || !comanda) {
        return { success: false, error: 'Error obteniendo comanda', faltantes: [] };
      }

      const faltantes: Array<{ item: string; faltante: number }> = [];

      for (const item of comanda.items) {
        // Obtener recetas del platillo
        const { data: recetas, error: recetasError } = await RecipeService.getByDish(item.dish_id);
        
        if (recetasError || !recetas || recetas.length === 0) {
          console.warn(`No se encontraron recetas para ${item.dish_name} (ID: ${item.dish_id})`);
          continue; // Si no hay receta, no validamos stock
        }

        for (const receta of recetas) {
          const cantidadNecesaria = receta.quantity * item.quantity;
          
          // Si la receta tiene un lote específico, validar solo ese lote
          if (receta.batch_id) {
            const { data: lote, error: loteError } = await BatchService.getById(receta.batch_id);
            
            if (loteError || !lote) {
              faltantes.push({
                item: `${receta.inventory_item_name || 'Producto desconocido'} (Lote específico no encontrado)`,
                faltante: cantidadNecesaria
              });
              continue;
            }

            if (lote.quantity < cantidadNecesaria) {
              faltantes.push({
                item: `${receta.inventory_item_name || 'Producto desconocido'} (Lote: ${lote.batch_number})`,
                faltante: cantidadNecesaria - lote.quantity
              });
            }
          } else {
            // Si no hay lote específico, validar stock total disponible
            const { data: stockDisponible, error: stockError } = await BatchService.getTotalStock(receta.inventory_item_id);
            
            if (stockError) {
              console.error(`Error obteniendo stock para ${receta.inventory_item_name}:`, stockError);
              continue;
            }

            if (stockDisponible < cantidadNecesaria) {
              faltantes.push({
                item: receta.inventory_item_name || 'Producto desconocido',
                faltante: cantidadNecesaria - stockDisponible
              });
            }
          }
        }
      }

      if (faltantes.length > 0) {
        return { success: false, error: 'Stock insuficiente', faltantes };
      }

      return { success: true, faltantes: [] };
    } catch (err) {
      console.error('Error validando stock:', err);
      return { success: false, error: 'Error interno del servidor', faltantes: [] };
    }
  }

  /**
   * Cerrar venta con facturación electrónica y descargar inventario
   */
  static async cerrarVenta(
    comandaId: string, 
    paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia',
    cajaEmployeeId: string,
    clienteData?: {
      ruc?: string;
      razon_social?: string;
      direccion?: string;
      telefono?: string;
      email?: string;
    }
  ): Promise<{ success: boolean; error?: string; facturaData?: any; ticket?: TicketVenta }> {
    try {
      // 1. Validar stock disponible
      const { success: stockValid, error: stockError, faltantes } = await this.validarStockDisponible(comandaId);
      
      if (!stockValid) {
        return { 
          success: false, 
          error: `Stock insuficiente: ${faltantes.map(f => `${f.item} (faltan ${f.faltante})`).join(', ')}` 
        };
      }

      // 2. Obtener comanda
      const { data: comanda, error: comandaError } = await ComandaService.getById(comandaId);
      
      if (comandaError || !comanda) {
        return { success: false, error: 'Error obteniendo comanda' };
      }

      // 3. Procesar facturación electrónica completa
      const { success: facturaSuccess, error: facturaError, facturaData } = await SriIntegrationService.procesarFacturaCompleta(
        comanda,
        clienteData
      );

      if (!facturaSuccess) {
        return { success: false, error: facturaError || 'Error procesando facturación electrónica' };
      }

      // 4. Descargar inventario
      await this.descargarInventario(comanda);

      // 5. Marcar comanda como cerrada
      // Si cajaEmployeeId es null, usar null (no crear empleado por defecto)
      const validCajaEmployeeId = cajaEmployeeId;

      console.log('Marcando comanda como cerrada:', {
        comandaId,
        paymentMethod,
        cajaEmployeeId: validCajaEmployeeId,
        ticketNumber: facturaData?.secuencial || 'N/A'
      });

      const { success: closeSuccess, error: closeError } = await ComandaService.markAsClosed(
        comandaId,
        paymentMethod,
        validCajaEmployeeId,
        facturaData?.secuencial || 'N/A'
      );

      if (!closeSuccess) {
        console.error('Error marcando comanda como cerrada:', closeError);
        return { success: false, error: closeError || 'Error cerrando comanda' };
      }

      console.log('Comanda marcada como cerrada exitosamente');

      // 6. Generar ticket con datos fiscales
      const ticket: TicketVenta = {
        ticketNumber: facturaData?.secuencial || 'N/A',
        comandaId,
        tableNumber: comanda.table_number,
        employeeName: comanda.employee_name,
        items: comanda.items.map(item => ({
          dish_name: item.dish_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        })),
        subtotal: comanda.total_amount,
        impuestos: 0, // Se calculará en el XML
        total: comanda.total_amount,
        paymentMethod,
        fecha: new Date().toISOString()
      };

      return { 
        success: true, 
        facturaData: {
          ...facturaData,
          autorizacion: facturaData?.autorizacion,
          fechaAutorizacion: facturaData?.fechaAutorizacion,
          claveAcceso: facturaData?.claveAcceso,
          ride: facturaData?.ride
        },
        ticket 
      };
    } catch (err) {
      console.error('Error cerrando venta:', err);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Descargar inventario basado en las recetas
   */
  private static async descargarInventario(comanda: ComandaComplete): Promise<void> {
    for (const item of comanda.items) {
      // Obtener recetas del platillo
      const { data: recetas, error: recetasError } = await RecipeService.getByDish(item.dish_id);
      
      if (recetasError || !recetas || recetas.length === 0) {
        console.warn(`No se encontraron recetas para ${item.dish_name} (ID: ${item.dish_id})`);
        continue;
      }

      for (const receta of recetas) {
        const cantidadNecesaria = receta.quantity * item.quantity;
        
        // Si la receta tiene un lote específico, descontar solo de ese lote
        if (receta.batch_id) {
          const { data: lote, error: loteError } = await BatchService.getById(receta.batch_id);
          
          if (loteError || !lote) {
            console.error(`Lote específico no encontrado para ${receta.inventory_item_name}:`, loteError);
            continue;
          }

          if (lote.quantity < cantidadNecesaria) {
            console.error(`Stock insuficiente en lote específico ${lote.batch_number} para ${receta.inventory_item_name}`);
            continue;
          }

          // Descontar del lote específico
          const { success: updateSuccess, error: updateError } = await BatchService.updateQuantity(
            lote.id,
            lote.quantity - cantidadNecesaria
          );

          if (!updateSuccess) {
            console.error(`Error actualizando lote específico ${lote.batch_number}:`, updateError);
            continue;
          }

          // Crear movimiento de stock
          await StockService.createMovement({
            inventory_item_id: receta.inventory_item_id,
            batch_id: lote.id,
            movement_type: 'sale',
            quantity: -cantidadNecesaria,
            reason: `Venta: ${item.dish_name} (Lote específico: ${lote.batch_number})`,
            reference: comanda.id
          });
        } else {
          // Si no hay lote específico, usar FIFO
          const { success, error, lotesUsados } = await BatchService.descontarCantidad(
            receta.inventory_item_id,
            cantidadNecesaria,
            comanda.id
          );

          if (!success) {
            console.error(`Error descontando ${receta.inventory_item_name}:`, error);
            continue;
          }

          // Crear movimientos de stock para cada lote usado
          for (const loteUsado of lotesUsados) {
            await StockService.createMovement({
              inventory_item_id: receta.inventory_item_id,
              batch_id: loteUsado.batchId,
              movement_type: 'sale',
              quantity: -loteUsado.cantidadDescontada,
              reason: `Venta: ${item.dish_name}`,
              reference: comanda.id
            });
          }
        }
      }
    }
  }

  /**
   * Obtener estadísticas del día
   */
  static async getEstadisticasDia(): Promise<{ data: EstadisticasCaja | null; error: any }> {
    try {
      const hoy = new Date();
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

      const { data: comandasCerradas, error } = await supabase
        .from('comandas')
        .select('total_amount, payment_method')
        .eq('status', 'closed')
        .gte('closed_at', inicioDia.toISOString())
        .lt('closed_at', finDia.toISOString());

      if (error) {
        console.error('Error obteniendo estadísticas:', error);
        return { data: null, error };
      }

      const estadisticas: EstadisticasCaja = {
        totalVentas: comandasCerradas?.length || 0,
        comandasCerradas: comandasCerradas?.length || 0,
        ingresosEfectivo: 0,
        ingresosTarjeta: 0,
        ingresosTransferencia: 0,
        totalIngresos: 0
      };

      comandasCerradas?.forEach(comanda => {
        estadisticas.totalIngresos += comanda.total_amount || 0;
        
        switch (comanda.payment_method) {
          case 'efectivo':
            estadisticas.ingresosEfectivo += comanda.total_amount || 0;
            break;
          case 'tarjeta':
            estadisticas.ingresosTarjeta += comanda.total_amount || 0;
            break;
          case 'transferencia':
            estadisticas.ingresosTransferencia += comanda.total_amount || 0;
            break;
        }
      });

      return { data: estadisticas, error: null };
    } catch (err) {
      console.error('Error en getEstadisticasDia:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Obtener historial de ventas cerradas
   */
  static async getHistorialVentas(limit: number = 50): Promise<{ data: ComandaComplete[] | null; error: any }> {
    return ComandaService.getComandasCerradas(limit);
  }

  /**
   * Obtener empleados de caja
   */
  static async getEmpleadosCaja(): Promise<{ data: Array<{ id: string; name: string }> | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('id, name')
        .eq('position', 'mesero') // Por ahora solo meseros pueden ser de caja
        .order('name');

      if (error) {
        console.error('Error obteniendo empleados de caja:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getEmpleadosCaja:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Obtener datos fiscales de la empresa
   */
  static async getCompanyFiscalData(): Promise<{ data: any; error: any }> {
    return FiscalService.getCompanyFiscalData();
  }

  /**
   * Guardar datos fiscales de la empresa
   */
  static async saveCompanyFiscalData(data: any): Promise<{ success: boolean; error?: string }> {
    return FiscalService.saveCompanyFiscalData(data);
  }

  /**
   * Obtener facturas del día
   */
  static async getFacturasDelDia(): Promise<{ data: any[] | null; error: any }> {
    try {
      const hoy = new Date();
      const inicioDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
      const finDia = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);

      const { data, error } = await supabase
        .from('comandas')
        .select(`
          *,
          invoice_items (*)
        `)
        .eq('status', 'closed')
        .gte('closed_at', inicioDia.toISOString())
        .lt('closed_at', finDia.toISOString())
        .order('closed_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo facturas del día:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getFacturasDelDia:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Obtener RIDE de una factura
   */
  static async getRIDE(comandaId: string): Promise<{ data: string | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('comandas')
        .select('ride_generado')
        .eq('id', comandaId)
        .single();

      if (error) {
        console.error('Error obteniendo RIDE:', error);
        return { data: null, error };
      }

      return { data: data?.ride_generado || null, error: null };
    } catch (err) {
      console.error('Error en getRIDE:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Reimprimir factura
   */
  static async reimprimirFactura(comandaId: string): Promise<{ success: boolean; error?: string; ride?: string }> {
    try {
      const { data: ride, error: rideError } = await this.getRIDE(comandaId);
      
      if (rideError || !ride) {
        return { success: false, error: 'No se encontró RIDE para esta factura' };
      }

      return { success: true, ride };
    } catch (err) {
      console.error('Error reimprimiendo factura:', err);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Consultar estado de factura en SRI
   */
  static async consultarEstadoFactura(comandaId: string, claveAcceso: string): Promise<{ success: boolean; estado?: string; error?: string }> {
    return SriIntegrationService.consultarEstadoFactura(comandaId, claveAcceso);
  }
}
