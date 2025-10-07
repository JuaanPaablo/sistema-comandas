import { ComandaComplete } from './comandaService';
import { CompanyFiscalData, InvoiceItem } from './fiscalService';

export interface XMLFacturaData {
  companyData: CompanyFiscalData;
  comanda: ComandaComplete;
  items: InvoiceItem[];
  secuencial: string;
  claveAcceso: string;
}

export class XMLGeneratorService {
  /**
   * Generar XML de factura electrónica conforme al SRI
   */
  static generateFacturaXML(data: XMLFacturaData): string {
    const { companyData, comanda, items, secuencial, claveAcceso } = data;
    
    // Calcular totales
    const subtotal0 = items
      .filter(item => item.codigo_impuesto === '0')
      .reduce((sum, item) => sum + item.precio_total_sin_impuestos, 0);
    
    const subtotal12 = items
      .filter(item => item.codigo_impuesto === '2')
      .reduce((sum, item) => sum + item.precio_total_sin_impuestos, 0);
    
    const iva12 = items
      .filter(item => item.codigo_impuesto === '2')
      .reduce((sum, item) => sum + item.valor_impuesto || 0, 0);
    
    const total = subtotal0 + subtotal12 + iva12;

    // Datos del cliente (consumidor final si no se especifica)
    const clienteRuc = comanda.cliente_ruc || '9999999999';
    const clienteRazonSocial = comanda.cliente_razon_social || 'CONSUMIDOR FINAL';
    const clienteDireccion = comanda.cliente_direccion || 'N/A';
    const clienteTelefono = comanda.cliente_telefono || '';
    const clienteEmail = comanda.cliente_email || '';

    const fechaEmision = new Date().toISOString().split('T')[0];
    const horaEmision = new Date().toLocaleTimeString('es-EC', { 
      hour12: false, 
      timeZone: 'America/Guayaquil' 
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="2.1.0">
    <infoTributaria>
        <ambiente>${companyData.ambiente}</ambiente>
        <tipoEmision>${companyData.tipo_emision}</tipoEmision>
        <razonSocial>${this.escapeXml(companyData.razon_social)}</razonSocial>
        <nombreComercial>${this.escapeXml(companyData.nombre_comercial || companyData.razon_social)}</nombreComercial>
        <ruc>${companyData.ruc}</ruc>
        <claveAcceso>${claveAcceso}</claveAcceso>
        <codDoc>01</codDoc>
        <estab>${companyData.codigo_establecimiento || '001'}</estab>
        <ptoEmi>${companyData.codigo_punto_emision || '001'}</ptoEmi>
        <secuencial>${secuencial}</secuencial>
        <dirMatriz>${this.escapeXml(companyData.direccion_matriz)}</dirMatriz>
    </infoTributaria>
    <infoFactura>
        <fechaEmision>${fechaEmision}</fechaEmision>
        <dirEstablecimiento>${this.escapeXml(companyData.direccion_establecimiento || companyData.direccion_matriz)}</dirEstablecimiento>
        <obligadoContabilidad>${companyData.ambiente === 'produccion' ? 'SI' : 'NO'}</obligadoContabilidad>
        <tipoIdentificacionComprador>${clienteRuc.length === 13 ? '04' : '07'}</tipoIdentificacionComprador>
        <guiaRemision>${comanda.notes || ''}</guiaRemision>
        <razonSocialComprador>${this.escapeXml(clienteRazonSocial)}</razonSocialComprador>
        <identificacionComprador>${clienteRuc}</identificacionComprador>
        <direccionComprador>${this.escapeXml(clienteDireccion)}</direccionComprador>
        <totalSinImpuestos>${(subtotal0 + subtotal12).toFixed(2)}</totalSinImpuestos>
        <totalDescuento>0.00</totalDescuento>
        <totalImpuestos>
            <totalImpuesto>
                <codigo>2</codigo>
                <codigoPorcentaje>2</codigoPorcentaje>
                <baseImponible>${subtotal12.toFixed(2)}</baseImponible>
                <tarifa>12.00</tarifa>
                <valor>${iva12.toFixed(2)}</valor>
            </totalImpuesto>
        </totalImpuestos>
        <importeTotal>${total.toFixed(2)}</importeTotal>
        <moneda>DOLAR</moneda>
        <pagos>
            <pago>
                <formaPago>${this.getFormaPago(comanda.payment_method || 'efectivo')}</formaPago>
                <total>${total.toFixed(2)}</total>
                <plazo>0</plazo>
                <unidadTiempo>dias</unidadTiempo>
            </pago>
        </pagos>
    </infoFactura>
    <detalles>
        ${items.map(item => this.generateDetalleXML(item)).join('\n        ')}
    </detalles>
    <infoAdicional>
        <campoAdicional nombre="Email">${clienteEmail}</campoAdicional>
        <campoAdicional nombre="Teléfono">${clienteTelefono}</campoAdicional>
        <campoAdicional nombre="Mesa">${comanda.table_number}</campoAdicional>
        <campoAdicional nombre="Mesero">${comanda.employee_name}</campoAdicional>
    </infoAdicional>
</factura>`;

    return xml;
  }

  /**
   * Generar XML de detalle de item
   */
  private static generateDetalleXML(item: InvoiceItem): string {
    return `<detalle>
            <codigoPrincipal>${item.codigo_principal || '001'}</codigoPrincipal>
            <codigoAuxiliar>${item.codigo_auxiliar || ''}</codigoAuxiliar>
            <descripcion>${this.escapeXml(item.descripcion)}</descripcion>
            <cantidad>${item.cantidad}</cantidad>
            <precioUnitario>${item.precio_unitario.toFixed(6)}</precioUnitario>
            <descuento>${item.descuento.toFixed(2)}</descuento>
            <precioTotalSinImpuestos>${item.precio_total_sin_impuestos.toFixed(2)}</precioTotalSinImpuestos>
            <impuestos>
                <impuesto>
                    <codigo>${item.codigo_impuesto || '2'}</codigo>
                    <codigoPorcentaje>${item.codigo_porcentaje || '2'}</codigoPorcentaje>
                    <tarifa>${item.tarifa?.toFixed(2) || '12.00'}</tarifa>
                    <baseImponible>${item.base_imponible?.toFixed(2) || '0.00'}</baseImponible>
                    <valor>${item.valor_impuesto?.toFixed(2) || '0.00'}</valor>
                </impuesto>
            </impuestos>
        </detalle>`;
  }

  /**
   * Obtener código de forma de pago según SRI
   */
  private static getFormaPago(paymentMethod: string): string {
    const formasPago: { [key: string]: string } = {
      'efectivo': '01',
      'tarjeta': '19',
      'transferencia': '20',
      'cheque': '16'
    };
    return formasPago[paymentMethod] || '01';
  }

  /**
   * Escapar caracteres especiales para XML
   */
  private static escapeXml(text: string): string {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Generar RIDE (Representación Impresa del Documento Electrónico)
   */
  static generateRIDE(data: XMLFacturaData, xmlFirmado: string): string {
    const { companyData, comanda, items, secuencial, claveAcceso } = data;
    
    // Calcular totales
    const subtotal0 = items
      .filter(item => item.codigo_impuesto === '0')
      .reduce((sum, item) => sum + item.precio_total_sin_impuestos, 0);
    
    const subtotal12 = items
      .filter(item => item.codigo_impuesto === '2')
      .reduce((sum, item) => sum + item.precio_total_sin_impuestos, 0);
    
    const iva12 = items
      .filter(item => item.codigo_impuesto === '2')
      .reduce((sum, item) => sum + item.valor_impuesto || 0, 0);
    
    const total = subtotal0 + subtotal12 + iva12;

    const fechaEmision = new Date().toLocaleDateString('es-EC', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Guayaquil'
    });

    const horaEmision = new Date().toLocaleTimeString('es-EC', { 
      hour12: false, 
      timeZone: 'America/Guayaquil' 
    });

    const clienteRuc = comanda.cliente_ruc || '9999999999';
    const clienteRazonSocial = comanda.cliente_razon_social || 'CONSUMIDOR FINAL';

    const ride = `
========================================
        FACTURA ELECTRÓNICA
========================================

DATOS DEL EMISOR:
RUC: ${companyData.ruc}
Razón Social: ${companyData.razon_social}
Nombre Comercial: ${companyData.nombre_comercial || companyData.razon_social}
Dirección: ${companyData.direccion_matriz}
Teléfono: ${companyData.telefono || 'N/A'}
Email: ${companyData.email || 'N/A'}

DATOS DEL COMPRADOR:
Identificación: ${clienteRuc}
Razón Social: ${clienteRazonSocial}
Dirección: ${comanda.cliente_direccion || 'N/A'}
Teléfono: ${comanda.cliente_telefono || 'N/A'}
Email: ${comanda.cliente_email || 'N/A'}

DATOS DE LA FACTURA:
Número: ${companyData.codigo_establecimiento || '001'}-${companyData.codigo_punto_emision || '001'}-${secuencial}
Fecha: ${fechaEmision}
Hora: ${horaEmision}
Clave de Acceso: ${claveAcceso}
Mesa: ${comanda.table_number}
Mesero: ${comanda.employee_name}

DETALLE DE PRODUCTOS:
${items.map((item, index) => `
${index + 1}. ${item.descripcion}
   Cantidad: ${item.cantidad}
   Precio Unitario: $${item.precio_unitario.toFixed(2)}
   Descuento: $${item.descuento.toFixed(2)}
   Subtotal: $${item.precio_total_sin_impuestos.toFixed(2)}
   IVA (${item.tarifa?.toFixed(2) || '12.00'}%): $${item.valor_impuesto?.toFixed(2) || '0.00'}
`).join('')}

RESUMEN DE IMPUESTOS:
Subtotal (0%): $${subtotal0.toFixed(2)}
Subtotal (12%): $${subtotal12.toFixed(2)}
IVA (12%): $${iva12.toFixed(2)}

TOTAL: $${total.toFixed(2)}

FORMA DE PAGO: ${this.getFormaPagoTexto(comanda.payment_method || 'efectivo')}

========================================
Este documento es una representación impresa
de un comprobante electrónico autorizado por el SRI
========================================
`;

    return ride;
  }

  /**
   * Obtener texto de forma de pago
   */
  private static getFormaPagoTexto(paymentMethod: string): string {
    const formasPago: { [key: string]: string } = {
      'efectivo': 'EFECTIVO',
      'tarjeta': 'TARJETA DE CRÉDITO/DÉBITO',
      'transferencia': 'TRANSFERENCIA BANCARIA',
      'cheque': 'CHEQUE'
    };
    return formasPago[paymentMethod] || 'EFECTIVO';
  }
}
