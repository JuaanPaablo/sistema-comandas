import { supabase } from '@/lib/supabase';

export interface CompanyFiscalData {
  id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion_matriz: string;
  direccion_establecimiento?: string;
  codigo_establecimiento?: string;
  codigo_punto_emision?: string;
  telefono?: string;
  email?: string;
  ambiente: 'pruebas' | 'produccion';
  tipo_emision: 'normal' | 'indisponibilidad';
  created_at: string;
  updated_at: string;
}

export interface InvoiceSequence {
  id: string;
  company_id: string;
  tipo_comprobante: string;
  codigo_establecimiento: string;
  codigo_punto_emision: string;
  secuencial_actual: number;
  secuencial_maximo: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface TaxConfiguration {
  id: string;
  codigo_impuesto: string;
  codigo_porcentaje: string;
  nombre: string;
  porcentaje: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  comanda_id: string;
  codigo_principal?: string;
  codigo_auxiliar?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  precio_total_sin_impuestos: number;
  codigo_impuesto?: string;
  codigo_porcentaje?: string;
  tarifa?: number;
  base_imponible?: number;
  valor_impuesto?: number;
  created_at: string;
}

export class FiscalService {
  /**
   * Obtener datos fiscales de la empresa
   */
  static async getCompanyFiscalData(): Promise<{ data: CompanyFiscalData | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('company_fiscal_data')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error obteniendo datos fiscales:', error);
        return { data: null, error };
      }

      return { data: data || null, error: null };
    } catch (err) {
      console.error('Error en getCompanyFiscalData:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Guardar datos fiscales de la empresa
   */
  static async saveCompanyFiscalData(data: Omit<CompanyFiscalData, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('company_fiscal_data')
        .upsert({
          ...data,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error guardando datos fiscales:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error en saveCompanyFiscalData:', err);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Obtener secuencial para tipo de comprobante
   */
  static async getNextSequential(
    tipoComprobante: string,
    codigoEstablecimiento: string,
    codigoPuntoEmision: string
  ): Promise<{ data: string | null; error: any }> {
    try {
      const { data: companyData, error: companyError } = await this.getCompanyFiscalData();
      
      if (companyError || !companyData) {
        return { data: null, error: 'No se encontraron datos fiscales de la empresa' };
      }

      // Buscar secuencial existente para la empresa y los códigos dados
      let { data: sequence, error: sequenceError } = await supabase
        .from('invoice_sequences')
        .select('*')
        .eq('company_id', companyData.id)
        .eq('tipo_comprobante', tipoComprobante)
        .eq('codigo_establecimiento', codigoEstablecimiento)
        .eq('codigo_punto_emision', codigoPuntoEmision)
        .eq('activo', true)
        .single();

      // Si no existe, lo creamos automáticamente iniciando en 0
      if (sequenceError || !sequence) {
        // Para datos de prueba, usar un UUID fijo para evitar problemas de FK
        const companyId = companyData.id === 'default-company-id' 
          ? '00000000-0000-0000-0000-000000000001' 
          : companyData.id;

        const { data: created, error: createError } = await supabase
          .from('invoice_sequences')
          .insert({
            company_id: companyId,
            tipo_comprobante: tipoComprobante,
            codigo_establecimiento: codigoEstablecimiento,
            codigo_punto_emision: codigoPuntoEmision,
            secuencial_actual: 0,
            secuencial_maximo: 999999999,
            activo: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select('*')
          .single();

        if (createError) {
          // Si el error es por duplicado, intentar obtener el existente
          if (createError.code === '23505') {
            console.log('Secuencial ya existe, obteniendo el existente...');
            const { data: existingSequence, error: existingError } = await supabase
              .from('invoice_sequences')
              .select('*')
              .eq('company_id', companyId)
              .eq('tipo_comprobante', tipoComprobante)
              .eq('codigo_establecimiento', codigoEstablecimiento)
              .eq('codigo_punto_emision', codigoPuntoEmision)
              .eq('activo', true)
              .single();

            if (existingError) {
              console.error('Error obteniendo secuencial existente:', existingError);
              return { data: null, error: existingError };
            }

            sequence = existingSequence;
          } else {
            console.error('Error creando secuencial por primera vez:', createError);
            return { data: null, error: 'No se pudo crear el secuencial para la empresa' };
          }
        } else {
          // Usamos el creado como base
          sequence = created;
        }
      }

      // Incrementar secuencial
      const nuevoSecuencial = sequence.secuencial_actual + 1;
      
      if (nuevoSecuencial > sequence.secuencial_maximo) {
        return { data: null, error: 'Secuencial máximo alcanzado' };
      }

      // Actualizar secuencial
      const { error: updateError } = await supabase
        .from('invoice_sequences')
        .update({ 
          secuencial_actual: nuevoSecuencial,
          updated_at: new Date().toISOString()
        })
        .eq('id', sequence.id);

      if (updateError) {
        console.error('Error actualizando secuencial:', updateError);
        return { data: null, error: updateError };
      }

      // Formatear secuencial con ceros a la izquierda
      const secuencialFormateado = nuevoSecuencial.toString().padStart(9, '0');
      return { data: secuencialFormateado, error: null };
    } catch (err) {
      console.error('Error en getNextSequential:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Generar clave de acceso para factura
   */
  static async generateClaveAcceso(
    ruc: string,
    ambiente: string,
    tipoComprobante: string,
    codigoEstablecimiento: string,
    codigoPuntoEmision: string,
    secuencial: string,
    codigoNumerico: string,
    tipoEmision: string
  ): Promise<string> {
    const fecha = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const claveAcceso = `${fecha}${tipoComprobante}${ruc}${ambiente}${codigoEstablecimiento}${codigoPuntoEmision}${secuencial}${codigoNumerico}${tipoEmision}`;
    
    // Calcular dígito verificador (algoritmo módulo 11)
    const digitos = claveAcceso.split('').map(Number);
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = digitos.length - 1; i >= 0; i--) {
      suma += digitos[i] * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const residuo = suma % 11;
    const digitoVerificador = residuo < 2 ? residuo : 11 - residuo;
    
    const claveCompleta = `${claveAcceso}${digitoVerificador}`;
    
    // Limitar a 49 caracteres para evitar errores de base de datos
    return claveCompleta.substring(0, 49);
  }

  /**
   * Obtener configuración de impuestos
   */
  static async getTaxConfiguration(): Promise<{ data: TaxConfiguration[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('tax_configuration')
        .select('*')
        .eq('activo', true)
        .order('porcentaje', { ascending: false });

      if (error) {
        console.error('Error obteniendo configuración de impuestos:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error en getTaxConfiguration:', err);
      return { data: null, error: err };
    }
  }

  /**
   * Calcular impuestos para un item
   */
  static async calculateTaxes(
    precioUnitario: number,
    cantidad: number,
    descuento: number = 0,
    codigoImpuesto: string = '2' // IVA 12% por defecto
  ): Promise<{
    precioTotalSinImpuestos: number;
    baseImponible: number;
    valorImpuesto: number;
    tarifa: number;
  }> {
    try {
      const { data: taxConfig, error } = await this.getTaxConfiguration();
      
      if (error || !taxConfig || taxConfig.length === 0) {
        console.warn('No se encontró configuración de impuestos, usando valores por defecto');
        // Usar valores por defecto si no hay configuración
        const subtotal = precioUnitario * cantidad;
        const precioTotalSinImpuestos = subtotal - descuento;
        const baseImponible = precioTotalSinImpuestos;
        const valorImpuesto = codigoImpuesto === '2' ? (baseImponible * 12) / 100 : 0;
        const tarifa = codigoImpuesto === '2' ? 12 : 0;

        return {
          precioTotalSinImpuestos,
          baseImponible,
          valorImpuesto,
          tarifa
        };
      }

      const impuesto = taxConfig.find(t => t.codigo_impuesto === codigoImpuesto);
      
      if (!impuesto) {
        console.warn(`No se encontró configuración para impuesto ${codigoImpuesto}, usando valores por defecto`);
        // Usar valores por defecto si no se encuentra el impuesto específico
        const subtotal = precioUnitario * cantidad;
        const precioTotalSinImpuestos = subtotal - descuento;
        const baseImponible = precioTotalSinImpuestos;
        const valorImpuesto = codigoImpuesto === '2' ? (baseImponible * 12) / 100 : 0;
        const tarifa = codigoImpuesto === '2' ? 12 : 0;

        return {
          precioTotalSinImpuestos,
          baseImponible,
          valorImpuesto,
          tarifa
        };
      }

      const subtotal = precioUnitario * cantidad;
      const precioTotalSinImpuestos = subtotal - descuento;
      const baseImponible = precioTotalSinImpuestos;
      const valorImpuesto = (baseImponible * impuesto.porcentaje) / 100;

      return {
        precioTotalSinImpuestos,
        baseImponible,
        valorImpuesto,
        tarifa: impuesto.porcentaje
      };
    } catch (err) {
      console.error('Error calculando impuestos:', err);
      throw err;
    }
  }

  /**
   * Crear items de factura con impuestos
   */
  static async createInvoiceItems(
    comandaId: string,
    items: Array<{
      codigo_principal?: string;
      codigo_auxiliar?: string;
      descripcion: string;
      cantidad: number;
      precio_unitario: number;
      descuento?: number;
      codigo_impuesto?: string;
    }>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const invoiceItems: Omit<InvoiceItem, 'id' | 'created_at'>[] = [];

      for (const item of items) {
        const taxes = await this.calculateTaxes(
          item.precio_unitario,
          item.cantidad,
          item.descuento || 0,
          item.codigo_impuesto || '2'
        );

        invoiceItems.push({
          comanda_id: comandaId,
          codigo_principal: (item.codigo_principal || '001').substring(0, 25),
          codigo_auxiliar: (item.codigo_auxiliar || '').substring(0, 25),
          descripcion: item.descripcion.substring(0, 200),
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento: item.descuento || 0,
          precio_total_sin_impuestos: taxes.precioTotalSinImpuestos,
          codigo_impuesto: (item.codigo_impuesto || '2').substring(0, 10),
          codigo_porcentaje: (item.codigo_impuesto === '2' ? '2' : '0').substring(0, 10),
          tarifa: taxes.tarifa,
          base_imponible: taxes.baseImponible,
          valor_impuesto: taxes.valorImpuesto
        });
      }

      const { error } = await supabase
        .from('invoice_items')
        .insert(invoiceItems);

      if (error) {
        console.error('Error creando items de factura:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error en createInvoiceItems:', err);
      return { success: false, error: 'Error interno del servidor' };
    }
  }

  /**
   * Log de operaciones SRI
   */
  static async logSriOperation(
    comandaId: string,
    tipoOperacion: string,
    estado: string,
    mensaje: string,
    respuestaSri?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('sri_logs')
        .insert({
          comanda_id: comandaId,
          tipo_operacion: tipoOperacion,
          estado: estado,
          mensaje: mensaje,
          respuesta_sri: respuestaSri
        });

      if (error) {
        console.error('Error registrando log SRI:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('Error en logSriOperation:', err);
      return { success: false, error: 'Error interno del servidor' };
    }
  }
}
