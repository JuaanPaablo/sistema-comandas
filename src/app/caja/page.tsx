'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { CajaService, EstadisticasCaja } from '@/lib/services/cajaService';
import { ComandaService, ComandaComplete } from '@/lib/services/comandaService';
import PaymentModal from '@/components/caja/PaymentModal';
import { 
  ShoppingCart, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Clock, 
  CheckCircle, 
  Calculator,
  Search,
  Filter,
  List,
  Grid,
  X,
  RefreshCw,
  FileText,
  Settings,
  TrendingUp,
  Users,
  Receipt
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

export default function CajaPage() {
  const [comandasServidas, setComandasServidas] = useState<ComandaComplete[]>([]);
  const [filteredComandas, setFilteredComandas] = useState<ComandaComplete[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticasCaja | null>(null);
  const [loading, setLoading] = useState(true);
  const [cerrandoVenta, setCerrandoVenta] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedComanda, setSelectedComanda] = useState<ComandaComplete | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [meseroFilter, setMeseroFilter] = useState('all');
  
  // Estados para vista (tabla o tarjetas)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Estados para modal de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    mesero: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Cargar comandas servidas y estadísticas en paralelo
      const [comandasResult, estadisticasResult] = await Promise.all([
        CajaService.getComandasServidas(),
        CajaService.getEstadisticasDia()
      ]);

      if (comandasResult.data) {
        setComandasServidas(comandasResult.data);
        setFilteredComandas(comandasResult.data);
      }

      if (estadisticasResult.data) {
        setEstadisticas(estadisticasResult.data);
      }
    } catch (error) {
      console.error('Error cargando datos de caja:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar comandas
  useEffect(() => {
    let filtered = comandasServidas;

    if (searchTerm) {
      filtered = filtered.filter(comanda =>
        comanda.table_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        comanda.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (meseroFilter !== 'all') {
      filtered = filtered.filter(comanda => comanda.employee_name === meseroFilter);
    }

    setFilteredComandas(filtered);
  }, [searchTerm, meseroFilter, comandasServidas]);

  // Hook de paginación
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedComandas,
    goToPage
  } = usePagination({ data: filteredComandas || [], itemsPerPage: 10 });

  // Funciones para modal de filtros
  const openFilterModal = () => {
    setActiveFilters({
      mesero: meseroFilter
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setMeseroFilter(activeFilters.mesero);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({ mesero: 'all' });
    setMeseroFilter('all');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.mesero !== 'all') count++;
    return count;
  };

  // Obtener lista única de meseros
  const meseros = [...new Set(comandasServidas.map(c => c.employee_name))].sort();

  const handleOpenPaymentModal = useCallback((comanda: ComandaComplete) => {
    setSelectedComanda(comanda);
    setPaymentModalOpen(true);
  }, []);

  const handleClosePaymentModal = useCallback(() => {
    setPaymentModalOpen(false);
    setSelectedComanda(null);
  }, []);

  const handleConfirmPayment = async (paymentData: any) => {
    if (!selectedComanda) return;

    try {
      setCerrandoVenta(selectedComanda.id);
      
      // Por ahora usamos null para empleado de caja, en el futuro se puede obtener del contexto de autenticación
      const cajaEmployeeId = null; // No usar empleado por defecto
      
      const { success, error, facturaData, ticket } = await CajaService.cerrarVenta(
        selectedComanda.id,
        paymentData.paymentMethod,
        cajaEmployeeId,
        paymentData.clientData
      );

      if (success) {
        const mensaje = `Venta cerrada exitosamente!\n\n` +
          `📄 Factura: ${facturaData?.secuencial || 'N/A'}\n` +
          `🔑 Clave de Acceso: ${facturaData?.claveAcceso || 'N/A'}\n` +
          `✅ Autorización: ${facturaData?.autorizacion || 'Pendiente'}\n` +
          `💰 Total: $${ticket?.total || '0.00'}`;
        
        alert(mensaje);
        await loadData(); // Recargar datos
        handleClosePaymentModal();
      } else {
        alert(`Error cerrando venta: ${error}`);
      }
    } catch (error) {
      console.error('Error cerrando venta:', error);
      alert('Error interno del servidor');
    } finally {
      setCerrandoVenta(null);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
      <div className="px-12 py-8 mb-12">
        {/* Encabezado contextual (Operaciones) */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Caja (Operaciones)</h1>
          <p className="text-gray-600">Punto de venta: cobros de ventas y gestión de pedidos del día</p>
        </div>
        {/* Toolbar unificado */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por mesa o mesero..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 px-6 pl-12 text-gray-900 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
            />
          </div>

          {/* Filtros */}
          <Button
            onClick={openFilterModal}
            variant="outline"
            className="h-12 px-6 text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filtros
            {getActiveFiltersCount() > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </Button>

          {/* Vista */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <Button
              onClick={() => setViewMode('table')}
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className={`px-4 ${viewMode === 'table' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
            >
              <List className="w-4 h-4 mr-2" />
              Lista
            </Button>
            <Button
              onClick={() => setViewMode('cards')}
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              className={`px-4 ${viewMode === 'cards' ? 'bg-white shadow-sm' : 'text-gray-600'}`}
            >
              <Grid className="w-4 h-4 mr-2" />
              Tarjetas
            </Button>
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <Button
              onClick={() => window.location.href = '/caja/historial'}
              variant="outline"
              className="h-12 px-6 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <FileText className="w-5 h-5 mr-2" />
              Historial
            </Button>
            <Button
              onClick={() => window.location.href = '/caja/configuracion'}
              variant="outline"
              className="h-12 px-6 text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <Settings className="w-5 h-5 mr-2" />
              Configuración
            </Button>
            {/* CTA cruzado hacia Contabilidad → Gestión de Caja */}
            <Button
              onClick={() => window.location.href = '/contabilidad'}
              variant="outline"
              className="h-12 px-6 text-blue-700 border-blue-300 hover:bg-blue-50"
              title="Ir a Gestión de Caja (Contabilidad)"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Arqueos y Conciliación
            </Button>
            <Button
              onClick={loadData}
              className="h-12 px-6 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white shadow-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Estadísticas del día */}
        {estadisticas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.totalVentas}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Efectivo</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estadisticas.ingresosEfectivo)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tarjeta</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estadisticas.ingresosTarjeta)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Smartphone className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Transferencia</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(estadisticas.ingresosTransferencia)}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Contenido principal */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="text-gray-900 mt-4 text-lg">Cargando datos de caja...</p>
          </div>
        ) : filteredComandas.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-yellow-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || meseroFilter !== 'all' ? 'No se encontraron comandas' : 'No hay comandas pendientes'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {searchTerm || meseroFilter !== 'all' 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Todas las comandas servidas han sido cerradas'
              }
            </p>
          </div>
        ) : viewMode === 'table' ? (
          /* Vista de tabla */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mesa
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mesero
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Servida
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedComandas.map((comanda) => (
                    <tr key={comanda.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                            <Receipt className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">Mesa {comanda.table_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{comanda.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        {comanda.items_count} items
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-lg font-bold text-yellow-600">
                          {formatCurrency(comanda.total_amount)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTime(comanda.served_at || comanda.created_at)}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handleOpenPaymentModal(comanda)}
                          disabled={cerrandoVenta === comanda.id}
                          className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white px-4 py-2 text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cerrandoVenta === comanda.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Procesando...
                            </>
                          ) : (
                            <>
                              <Calculator className="w-4 h-4 mr-2" />
                              Procesar Pago
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Vista de tarjetas */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedComandas.map((comanda) => (
              <Card key={comanda.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Receipt className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">Mesa {comanda.table_number}</CardTitle>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-yellow-600">
                      {formatCurrency(comanda.total_amount)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Mesero: {comanda.employee_name}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Servida: {formatTime(comanda.served_at || comanda.created_at)}</span>
                  </div>

                  {/* Items de la comanda */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Items ({comanda.items_count}):</h4>
                    <div className="space-y-1 max-h-20 overflow-y-auto">
                      {comanda.items.slice(0, 3).map((item, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {item.quantity}x {item.dish_name}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(item.total_price)}
                          </span>
                        </div>
                      ))}
                      {comanda.items.length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{comanda.items.length - 3} items más...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Botón de cobro */}
                  <div className="pt-2">
                    <Button
                      onClick={() => handleOpenPaymentModal(comanda)}
                      disabled={cerrandoVenta === comanda.id}
                      className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {cerrandoVenta === comanda.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Procesando...
                        </>
                      ) : (
                        <>
                          <Calculator className="w-4 h-4 mr-2" />
                          Procesar Pago
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginación */}
        {!loading && filteredComandas.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredComandas.length}
              itemsPerPage={10}
              onPageChange={goToPage}
              itemType="comandas"
            />
          </div>
        )}

        {/* Modal de filtros */}
        {showFilterModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Filter className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Filtros de Comandas</h2>
                      <p className="text-sm text-gray-600">Selecciona los filtros que deseas aplicar</p>
                    </div>
                  </div>
                  <Button
                    onClick={closeFilterModal}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Contenido */}
              <div className="px-8 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  {/* Filtro por Mesero */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mesero
                    </label>
                    <select
                      value={activeFilters.mesero}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, mesero: e.target.value }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-yellow-500 focus:ring-yellow-500"
                    >
                      <option value="all">Todos los meseros</option>
                      {meseros.map((mesero) => (
                        <option key={mesero} value={mesero}>
                          👨‍💼 {mesero}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Limpiar Filtros
                  </Button>
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={closeFilterModal}
                      variant="outline"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={applyFilters}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-6"
                    >
                      Aplicar Filtros
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Modal de Pago */}
        <PaymentModal
          comanda={selectedComanda}
          isOpen={paymentModalOpen}
          onClose={handleClosePaymentModal}
          onConfirmPayment={handleConfirmPayment}
          loading={cerrandoVenta !== null}
        />
      </div>
    </>
  );
}
