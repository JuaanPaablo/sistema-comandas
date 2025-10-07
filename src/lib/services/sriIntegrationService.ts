import { supabase } from '@/lib/supabase';
import { FiscalService } from './fiscalService';
import { XMLGeneratorService, XMLFacturaData } from './xmlGeneratorService';
import { ComandaComplete } from './comandaService';

export interface SriResponse {
  success: boolean;
  autorizacion?: string;
  fechaAutorizacion?: string;
  mensaje?: string;
  estado?: string;
  xmlResponse?: string;
}

export class SriIntegrationService {
  private static readonly SRI_BASE_URL = process.env.NEXT_PUBLIC_SRI_BASE_URL || 'https://cel.sri.gob.ec';
  private static readonly SRI_TEST_URL = process.env.NEXT_PUBLIC_SRI_TEST_URL || 'https://celcer.sri.gob.ec';

  /**
   * Enviar factura al SRI para autorización
   */
  static async enviarFacturaAlSri(
    comandaId: string,
    xmlFirmado: string
  ): Promise<{ success: boolean; response?: SriResponse; error?: string }> {
    try {
      // Log inicio de operación
      await FiscalService.logSriOperation(
        comandaId,
        'enviar',
        'pendiente',
        'Iniciando envío de factura al SRI'
      );

      const { data: companyData, error: companyError } = await FiscalService.getCompanyFiscalData();
      
      if (companyError || !companyData) {
        await FiscalService.logSriOperation(
          comandaId,
          'enviar',
          'error',
          'No se encontraron datos fiscales de la empresa'
        );
        return { success: false, error: 'No se encontraron datos fiscales de la empresa' };
      }

      // Determinar URL según ambiente
      const baseUrl = companyData.ambiente === 'produccion' 
        ? this.SRI_BASE_URL 
        : this.SRI_TEST_URL;

      // En un entorno real, aquí se haría la integración con el SRI
      // Por ahora simulamos la respuesta
      const response = await this.simulateSriResponse(comandaId, xmlFirmado);

      // Log resultado
      await FiscalService.logSriOperation(
        comandaId,
        'enviar',
        response.success ? 'exitoso' : 'error',
        response.success ? 'Factura autorizada por el SRI' : response.mensaje || 'Error en autorización',
        JSON.stringify(response)
      );

      return { success: response.success, response, error: response.success ? undefined : response.mensaje };
    } catch (err) {
      console.error('Error enviando factura al SRI:', err);
      
      await FiscalService.logSriOperation(
        comandaId,
        'enviar',
        'error',
        `Error interno: ${err instanceof Error ? err.message : 'Error desconocido'}`
      );

      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error interno del servidor' 
      };
    }
  }

  /**
   * Simular respuesta del SRI (para desarrollo)
   */
  private static async simulateSriResponse(
    comandaId: string,
    xmlFirmado: string
  ): Promise<SriResponse> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simular respuesta exitosa (90% de probabilidad)
    const isSuccess = Math.random() > 0.1;

    if (isSuccess) {
      const autorizacion = this.generateAutorizacionNumber();
      const fechaAutorizacion = new Date().toISOString();

      return {
        success: true,
        autorizacion,
        fechaAutorizacion,
        mensaje: 'AUTORIZADO',
        estado: 'AUTORIZADO'
      };
    } else {
      return {
        success: false,
        mensaje: 'ERROR: Documento no autorizado - Error en validación',
        estado: 'NO AUTORIZADO'
      };
    }
  }

  /**
   * Generar número de autorización simulado
   */
  private static generateAutorizacionNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${timestamp}${random}`;
  }

  /**
   * Procesar factura completa (generar, firmar, enviar al SRI)
   */
  static async procesarFacturaCompleta(
    comanda: ComandaComplete,
    clienteData?: {
      ruc?: string;
      razon_social?: string;
      direccion?: string;
      telefono?: string;
      email?: string;
    }
  ): Promise<{ success: boolean; error?: string; facturaData?: any }> {
    try {
      // 1. Obtener datos fiscales de la empresa
      const { data: companyData, error: companyError } = await FiscalService.getCompanyFiscalData();
      
      // Si no hay datos fiscales, usar datos por defecto para pruebas
      let fiscalData = companyData;
      if (companyError || !companyData) {
        console.log('No se encontraron datos fiscales, usando configuración de pruebas');
        fiscalData = {
          id: 'default-company-id',
          ruc: '9999999999001',
          razon_social: 'EMPRESA DE PRUEBAS',
          nombre_comercial: 'Sistema de Comandas',
          direccion_matriz: 'Dirección de Pruebas',
          direccion_establecimiento: 'Establecimiento de Pruebas',
          codigo_establecimiento: '001',
          codigo_punto_emision: '001',
          telefono: '0999999999',
          email: 'pruebas@sistema.com',
          ambiente: 'pruebas' as const,
          tipo_emision: 'normal' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      // 2. Obtener secuencial
      const { data: secuencial, error: secuencialError } = await FiscalService.getNextSequential(
        '01', // Factura
        fiscalData.codigo_establecimiento || '001',
        fiscalData.codigo_punto_emision || '001'
      );

      if (secuencialError || !secuencial) {
        return { success: false, error: secuencialError || 'Error obteniendo secuencial' };
      }

      // 3. Generar clave de acceso
      const claveAcceso = await FiscalService.generateClaveAcceso(
        fiscalData.ruc,
        fiscalData.ambiente,
        '01', // Factura
        fiscalData.codigo_establecimiento || '001',
        fiscalData.codigo_punto_emision || '001',
        secuencial,
        '12345678', // Código numérico (debería ser único por empresa)
        fiscalData.tipo_emision
      );

      // 4. Actualizar comanda con datos fiscales
      const updateData: any = {
        tipo_comprobante: '01',
        codigo_establecimiento: (fiscalData.codigo_establecimiento || '001').substring(0, 10),
        codigo_punto_emision: (fiscalData.codigo_punto_emision || '001').substring(0, 10),
        secuencial: secuencial.substring(0, 20),
        clave_acceso: claveAcceso.substring(0, 49),
        cliente_ruc: (clienteData?.ruc || '9999999999').substring(0, 13),
        cliente_razon_social: (clienteData?.razon_social || 'CONSUMIDOR FINAL').substring(0, 100),
        cliente_direccion: (clienteData?.direccion || 'N/A').substring(0, 200),
        cliente_telefono: (clienteData?.telefono || '').substring(0, 20),
        cliente_email: (clienteData?.email || '').substring(0, 100),
        updated_at: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('comandas')
        .update(updateData)
        .eq('id', comanda.id);

      if (updateError) {
        console.error('Error actualizando datos fiscales de la comanda:', updateError);
        return { success: false, error: 'Error actualizando datos fiscales de la comanda' };
      }

      // 5. Crear items de factura con impuestos
      const invoiceItems = comanda.items.map(item => ({
        codigo_principal: '001', // Código del producto
        codigo_auxiliar: item.dish_id.substring(0, 25), // Limitar longitud
        descripcion: item.dish_name.substring(0, 200), // Limitar longitud
        cantidad: item.quantity,
        precio_unitario: item.unit_price,
        descuento: 0,
        codigo_impuesto: '2' // IVA 12%
      }));

      const { success: itemsSuccess, error: itemsError } = await FiscalService.createInvoiceItems(
        comanda.id,
        invoiceItems
      );

      if (!itemsSuccess) {
        return { success: false, error: itemsError || 'Error creando items de factura' };
      }

      // 6. Obtener items creados para generar XML
      const { data: createdItems, error: itemsQueryError } = await supabase
        .from('invoice_items')
        .select('*')
        .eq('comanda_id', comanda.id);

      if (itemsQueryError || !createdItems) {
        return { success: false, error: 'Error obteniendo items de factura' };
      }

      // 7. Generar XML
      const xmlData: XMLFacturaData = {
        companyData: fiscalData,
        comanda: { ...comanda, ...clienteData },
        items: createdItems,
        secuencial,
        claveAcceso
      };

      const xmlGenerado = XMLGeneratorService.generateFacturaXML(xmlData);

      // 8. Simular firma digital (en producción se usaría un certificado real)
      const xmlFirmado = this.simulateDigitalSignature(xmlGenerado);

      // 9. Enviar al SRI
      const { success: sriSuccess, response: sriResponse, error: sriError } = await this.enviarFacturaAlSri(
        comanda.id,
        xmlFirmado
      );

      if (!sriSuccess) {
        return { success: false, error: sriError || 'Error enviando factura al SRI' };
      }

      // 10. Actualizar comanda con respuesta del SRI
      const { error: finalUpdateError } = await supabase
        .from('comandas')
        .update({
          autorizacion_sri: sriResponse?.autorizacion,
          fecha_autorizacion: sriResponse?.fechaAutorizacion,
          estado_sri: sriResponse?.estado || 'AUTORIZADO',
          mensaje_sri: sriResponse?.mensaje,
          xml_generado: xmlGenerado,
          xml_firmado: xmlFirmado,
          updated_at: new Date().toISOString()
        })
        .eq('id', comanda.id);

      if (finalUpdateError) {
        console.error('Error actualizando respuesta del SRI:', finalUpdateError);
      }

      // 11. Generar RIDE
      const ride = XMLGeneratorService.generateRIDE(xmlData, xmlFirmado);

      // 12. Guardar RIDE
      const { error: rideError } = await supabase
        .from('comandas')
        .update({
          ride_generado: ride,
          updated_at: new Date().toISOString()
        })
        .eq('id', comanda.id);

      if (rideError) {
        console.error('Error guardando RIDE:', rideError);
      }

      return {
        success: true,
        facturaData: {
          secuencial,
          claveAcceso,
          autorizacion: sriResponse?.autorizacion,
          fechaAutorizacion: sriResponse?.fechaAutorizacion,
          xmlGenerado,
          xmlFirmado,
          ride
        }
      };
    } catch (err) {
      console.error('Error procesando factura completa:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error interno del servidor' 
      };
    }
  }

  /**
   * Simular firma digital (en producción se usaría un certificado real)
   */
  private static simulateDigitalSignature(xml: string): string {
    // En producción, aquí se aplicaría la firma digital real
    // Por ahora solo agregamos un comentario
    return `<!-- FIRMA DIGITAL SIMULADA -->\n${xml}`;
  }

  /**
   * Consultar estado de factura en el SRI
   */
  static async consultarEstadoFactura(
    comandaId: string,
    claveAcceso: string
  ): Promise<{ success: boolean; estado?: string; error?: string }> {
    try {
      // Log consulta
      await FiscalService.logSriOperation(
        comandaId,
        'consultar',
        'pendiente',
        `Consultando estado de factura: ${claveAcceso}`
      );

      // Simular consulta al SRI
      await new Promise(resolve => setTimeout(resolve, 1000));

      const estados = ['AUTORIZADO', 'NO AUTORIZADO', 'EN PROCESO'];
      const estado = estados[Math.floor(Math.random() * estados.length)];

      await FiscalService.logSriOperation(
        comandaId,
        'consultar',
        'exitoso',
        `Estado consultado: ${estado}`
      );

      return { success: true, estado };
    } catch (err) {
      console.error('Error consultando estado de factura:', err);
      
      await FiscalService.logSriOperation(
        comandaId,
        'consultar',
        'error',
        `Error en consulta: ${err instanceof Error ? err.message : 'Error desconocido'}`
      );

      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Error interno del servidor' 
      };
    }
  }
}
