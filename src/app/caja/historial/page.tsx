'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CajaService } from '@/lib/services/cajaService';
import { FileText, Search, Download, Eye, RefreshCw } from 'lucide-react';

export default function HistorialFacturasPage() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFacturas();
  }, []);

  const loadFacturas = async () => {
    try {
      setLoading(true);
      const { data, error } = await CajaService.getFacturasDelDia();
      
      if (error) {
        console.error('Error cargando facturas:', error);
        return;
      }

      setFacturas(data || []);
    } catch (error) {
      console.error('Error cargando facturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReimprimir = async (comandaId: string) => {
    try {
      const { success, error, ride } = await CajaService.reimprimirFactura(comandaId);
      
      if (success && ride) {
        // Abrir ventana nueva con RIDE para imprimir
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>RIDE - Factura Electrónica</title>
                <style>
                  body { font-family: monospace; font-size: 12px; margin: 20px; }
                  .ride-content { white-space: pre-line; }
                </style>
              </head>
              <body>
                <div class="ride-content">${ride}</div>
                <script>window.print();</script>
              </body>
            </html>
          `);
          printWindow.document.close();
        }
      } else {
        alert(`Error reimprimiendo factura: ${error}`);
      }
    } catch (error) {
      console.error('Error reimprimiendo factura:', error);
      alert('Error interno del servidor');
    }
  };

  const handleConsultarEstado = async (comandaId: string, claveAcceso: string) => {
    try {
      const { success, estado, error } = await CajaService.consultarEstadoFactura(comandaId, claveAcceso);
      
      if (success) {
        alert(`Estado de la factura: ${estado}`);
      } else {
        alert(`Error consultando estado: ${error}`);
      }
    } catch (error) {
      console.error('Error consultando estado:', error);
      alert('Error interno del servidor');
    }
  };

  const filteredFacturas = facturas.filter(factura =>
    factura.secuencial?.includes(searchTerm) ||
    factura.clave_acceso?.includes(searchTerm) ||
    factura.cliente_razon_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    factura.table_number?.includes(searchTerm)
  );

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Guayaquil'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Guayaquil'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando historial de facturas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileText className="h-8 w-8 mr-3 text-blue-600" />
                Historial de Facturas
              </h1>
              <p className="text-gray-600 mt-2">Gestiona y consulta las facturas emitidas</p>
            </div>
            <Button
              onClick={() => window.location.href = '/caja'}
              className="bg-gray-600 hover:bg-gray-700 text-white"
            >
              ← Volver a Caja
            </Button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar por secuencial, clave de acceso, cliente o mesa..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de facturas */}
        {filteredFacturas.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron facturas' : 'No hay facturas del día'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Intenta con otros términos de búsqueda' 
                : 'Las facturas aparecerán aquí una vez que se cierren las ventas'
              }
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredFacturas.map((factura) => (
              <Card key={factura.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Factura #{factura.secuencial || 'N/A'}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Mesa: {factura.table_number}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(factura.closed_at)} {formatTime(factura.closed_at)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Cliente</p>
                        <p className="text-sm text-gray-600">
                          {factura.cliente_razon_social || 'CONSUMIDOR FINAL'}
                        </p>
                        <p className="text-xs text-gray-500">
                          RUC: {factura.cliente_ruc || '9999999999'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Estado SRI</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          factura.estado_sri === 'AUTORIZADO' 
                            ? 'bg-green-100 text-green-800'
                            : factura.estado_sri === 'NO AUTORIZADO'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {factura.estado_sri || 'PENDIENTE'}
                        </span>
                        {factura.autorizacion_sri && (
                          <p className="text-xs text-gray-500 mt-1">
                            Auth: {factura.autorizacion_sri}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">
                          {formatCurrency(factura.total_amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {factura.payment_method?.toUpperCase() || 'EFECTIVO'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {factura.items_count} items
                        </p>
                      </div>
                    </div>
                    
                    {factura.clave_acceso && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs font-medium text-gray-700 mb-1">Clave de Acceso:</p>
                        <p className="text-xs text-gray-600 font-mono break-all">
                          {factura.clave_acceso}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex space-x-2">
                    <Button
                      onClick={() => handleReimprimir(factura.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      title="Reimprimir RIDE"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    {factura.clave_acceso && (
                      <Button
                        onClick={() => handleConsultarEstado(factura.id, factura.clave_acceso)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs"
                        title="Consultar estado en SRI"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Botón de actualizar */}
        <div className="mt-8 text-center">
          <Button
            onClick={loadFacturas}
            className="bg-gray-600 hover:bg-gray-700 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Lista
          </Button>
        </div>
      </div>
    </div>
  );
}
