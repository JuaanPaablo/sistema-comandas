'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { 
  TrendingDown, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  List,
  Grid,
  X,
  DollarSign,
  Clock,
  User,
  CreditCard,
  Smartphone,
  Receipt,
  Eye,
  RefreshCw,
  Building2,
  FileText
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

interface Egreso {
  id: string;
  type: 'compra' | 'gasto_operativo' | 'servicio' | 'otro';
  amount: number;
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia';
  description: string;
  supplier?: string;
  invoice_number?: string;
  employee_name: string;
  created_at: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export default function EgresosModule() {
  const [egresos, setEgresos] = useState<Egreso[]>([]);
  const [filteredEgresos, setFilteredEgresos] = useState<Egreso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'compra' | 'gasto_operativo' | 'servicio' | 'otro'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'efectivo' | 'tarjeta' | 'transferencia'>('all');
  
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    type: 'all' as 'all' | 'compra' | 'gasto_operativo' | 'servicio' | 'otro',
    payment_method: 'all' as 'all' | 'efectivo' | 'tarjeta' | 'transferencia'
  });

  const [showEgresoModal, setShowEgresoModal] = useState(false);
  const [editingEgreso, setEditingEgreso] = useState<Egreso | null>(null);
  const [egresoType, setEgresoType] = useState<'compra' | 'gasto_operativo' | 'servicio' | 'otro'>('compra');
  const [egresoAmount, setEgresoAmount] = useState('');
  const [egresoPaymentMethod, setEgresoPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [egresoDescription, setEgresoDescription] = useState('');
  const [egresoSupplier, setEgresoSupplier] = useState('');
  const [egresoInvoiceNumber, setEgresoInvoiceNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);

  const loadEgresos = async () => {
    try {
      setIsLoading(true);
      const mockEgresos: Egreso[] = [
        {
          id: '1',
          type: 'compra',
          amount: 150.00,
          payment_method: 'efectivo',
          description: 'Compra de ingredientes',
          supplier: 'Proveedor ABC',
          invoice_number: 'FAC-001',
          employee_name: 'Juan Pérez',
          created_at: '2024-01-15T10:30:00Z',
          status: 'completed'
        },
        {
          id: '2',
          type: 'gasto_operativo',
          amount: 75.50,
          payment_method: 'tarjeta',
          description: 'Servicios de limpieza',
          employee_name: 'María García',
          created_at: '2024-01-15T11:45:00Z',
          status: 'completed'
        },
        {
          id: '3',
          type: 'servicio',
          amount: 200.00,
          payment_method: 'transferencia',
          description: 'Mantenimiento de equipos',
          supplier: 'Servitec',
          invoice_number: 'FAC-002',
          employee_name: 'Carlos López',
          created_at: '2024-01-15T14:20:00Z',
          status: 'completed'
        }
      ];
      
      setEgresos(mockEgresos);
      setFilteredEgresos(mockEgresos);
    } catch (error) {
      console.error('Error cargando egresos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = egresos;

    if (searchTerm) {
      filtered = filtered.filter(egreso =>
        egreso.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        egreso.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (egreso.supplier && egreso.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(egreso => egreso.type === typeFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(egreso => egreso.payment_method === paymentFilter);
    }

    setFilteredEgresos(filtered);
  }, [searchTerm, typeFilter, paymentFilter, egresos]);

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedEgresos,
    goToPage
  } = usePagination({ data: filteredEgresos || [], itemsPerPage: 10 });

  const openFilterModal = () => {
    setActiveFilters({
      type: typeFilter,
      payment_method: paymentFilter
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => setShowFilterModal(false);

  const applyFilters = () => {
    setTypeFilter(activeFilters.type);
    setPaymentFilter(activeFilters.payment_method);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({ type: 'all', payment_method: 'all' });
    setTypeFilter('all');
    setPaymentFilter('all');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.type !== 'all') count++;
    if (activeFilters.payment_method !== 'all') count++;
    return count;
  };

  const openEgresoModal = useCallback((egreso?: Egreso) => {
    if (createButtonLoading) return;
    
    setCreateButtonLoading(true);
    try {
      if (egreso) {
        setEditingEgreso(egreso);
        setEgresoType(egreso.type);
        setEgresoAmount(egreso.amount.toString());
        setEgresoPaymentMethod(egreso.payment_method);
        setEgresoDescription(egreso.description);
        setEgresoSupplier(egreso.supplier || '');
        setEgresoInvoiceNumber(egreso.invoice_number || '');
      } else {
        setEditingEgreso(null);
        setEgresoType('compra');
        setEgresoAmount('');
        setEgresoPaymentMethod('efectivo');
        setEgresoDescription('');
        setEgresoSupplier('');
        setEgresoInvoiceNumber('');
      }
      setShowEgresoModal(true);
    } finally {
      setTimeout(() => setCreateButtonLoading(false), 100);
    }
  }, [createButtonLoading]);

  const closeEgresoModal = useCallback(() => {
    setShowEgresoModal(false);
    setEditingEgreso(null);
    setEgresoAmount('');
    setEgresoDescription('');
    setEgresoSupplier('');
    setEgresoInvoiceNumber('');
  }, []);

  const handleEgresoSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    if (!egresoAmount.trim()) {
      alert('El monto es requerido');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const egresoData: Egreso = {
        id: editingEgreso?.id || Date.now().toString(),
        type: egresoType,
        amount: parseFloat(egresoAmount),
        payment_method: egresoPaymentMethod,
        description: egresoDescription,
        supplier: egresoSupplier || undefined,
        invoice_number: egresoInvoiceNumber || undefined,
        employee_name: 'Usuario Actual',
        created_at: editingEgreso?.created_at || new Date().toISOString(),
        status: 'completed'
      };

      if (editingEgreso) {
        const updatedEgresos = egresos.map(egreso =>
          egreso.id === editingEgreso.id ? egresoData : egreso
        );
        setEgresos(updatedEgresos);
        setFilteredEgresos(updatedEgresos);
        alert('Egreso actualizado exitosamente');
      } else {
        setEgresos([egresoData, ...egresos]);
        setFilteredEgresos([egresoData, ...filteredEgresos]);
        alert('Egreso creado exitosamente');
      }
      
      closeEgresoModal();
    } catch (error) {
      console.error('Error procesando egreso:', error);
      alert('Error procesando el egreso');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, egresoAmount, egresoType, egresoPaymentMethod, egresoDescription, egresoSupplier, egresoInvoiceNumber, editingEgreso, egresos, closeEgresoModal]);

  useEffect(() => {
    loadEgresos();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'compra': return 'bg-blue-100 text-blue-800';
      case 'gasto_operativo': return 'bg-orange-100 text-orange-800';
      case 'servicio': return 'bg-purple-100 text-purple-800';
      case 'otro': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'compra': return 'Compra';
      case 'gasto_operativo': return 'Gasto Operativo';
      case 'servicio': return 'Servicio';
      case 'otro': return 'Otro';
      default: return 'Desconocido';
    }
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'efectivo': return <DollarSign className="w-4 h-4" />;
      case 'tarjeta': return <CreditCard className="w-4 h-4" />;
      case 'transferencia': return <Smartphone className="w-4 h-4" />;
      default: return <DollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentColor = (method: string) => {
    switch (method) {
      case 'efectivo': return 'text-green-600';
      case 'tarjeta': return 'text-blue-600';
      case 'transferencia': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const totalEgresos = filteredEgresos.reduce((sum, egreso) => sum + egreso.amount, 0);
  const totalCompras = filteredEgresos.filter(e => e.type === 'compra').reduce((sum, egreso) => sum + egreso.amount, 0);
  const totalGastosOperativos = filteredEgresos.filter(e => e.type === 'gasto_operativo').reduce((sum, egreso) => sum + egreso.amount, 0);

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
        {/* Toolbar unificado */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por descripción, empleado o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 px-6 pl-12 text-gray-900 border-gray-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>

          <Button
            onClick={openFilterModal}
            variant="outline"
            className="h-12 px-6 text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            <Filter className="w-5 h-5 mr-2" />
            Filtros
            {getActiveFiltersCount() > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                {getActiveFiltersCount()}
              </span>
            )}
          </Button>

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

          <Button
            onClick={() => openEgresoModal()}
            disabled={createButtonLoading}
            className="h-12 px-6 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createButtonLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Abriendo...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Egreso
              </>
            )}
          </Button>
          <Button
            onClick={loadEgresos}
            className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Egresos</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalEgresos)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Compras</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCompras)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gastos Operativos</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalGastosOperativos)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contenido principal */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-900 mt-4 text-lg">Cargando egresos...</p>
          </div>
        ) : filteredEgresos.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-red-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <TrendingDown className="w-12 h-12 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || typeFilter !== 'all' || paymentFilter !== 'all' ? 'No se encontraron egresos' : 'No hay egresos registrados'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {searchTerm || typeFilter !== 'all' || paymentFilter !== 'all' 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Comienza registrando tu primer egreso'
              }
            </p>
            {!searchTerm && typeFilter === 'all' && paymentFilter === 'all' && (
              <Button
                onClick={() => openEgresoModal()}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-8 py-3 text-lg shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Registrar Primer Egreso
              </Button>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* Vista de tabla */
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Proveedor
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleado
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEgresos.map((egreso) => (
                    <tr key={egreso.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(egreso.type)}`}>
                          {getTypeText(egreso.type)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{egreso.description}</div>
                        {egreso.invoice_number && (
                          <div className="text-xs text-gray-500">Factura: {egreso.invoice_number}</div>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        {egreso.supplier || '-'}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{egreso.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`mr-2 ${getPaymentColor(egreso.payment_method)}`}>
                            {getPaymentIcon(egreso.payment_method)}
                          </div>
                          <span className="text-sm text-gray-900 capitalize">{egreso.payment_method}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-lg font-bold text-red-600">
                          {formatCurrency(egreso.amount)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDateTime(egreso.created_at)}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEgresoModal(egreso)}
                            className="text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
            {paginatedEgresos.map((egreso) => (
              <Card key={egreso.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{egreso.description}</CardTitle>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(egreso.type)}`}>
                      {getTypeText(egreso.type)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {egreso.supplier && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Building2 className="w-4 h-4 mr-2" />
                      <span>{egreso.supplier}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>{egreso.employee_name}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <div className={`mr-2 ${getPaymentColor(egreso.payment_method)}`}>
                      {getPaymentIcon(egreso.payment_method)}
                    </div>
                    <span className="capitalize">{egreso.payment_method}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{formatDateTime(egreso.created_at)}</span>
                  </div>

                  <div className="text-center">
                    <span className="text-2xl font-bold text-red-600">
                      {formatCurrency(egreso.amount)}
                    </span>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEgresoModal(egreso)}
                      className="flex-1 text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginación */}
        {!isLoading && filteredEgresos.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredEgresos.length}
              itemsPerPage={10}
              onPageChange={goToPage}
              itemType="egresos"
            />
          </div>
        )}

        {/* Modal de filtros */}
        {showFilterModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Filter className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Filtros de Egresos</h2>
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

              <div className="px-8 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Egreso
                    </label>
                    <select
                      value={activeFilters.type}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, type: e.target.value as 'all' | 'compra' | 'gasto_operativo' | 'servicio' | 'otro' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-red-500 focus:ring-red-500"
                    >
                      <option value="all">Todos los tipos</option>
                      <option value="compra">🛒 Compras</option>
                      <option value="gasto_operativo">⚙️ Gastos Operativos</option>
                      <option value="servicio">🔧 Servicios</option>
                      <option value="otro">📋 Otros</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pago
                    </label>
                    <select
                      value={activeFilters.payment_method}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, payment_method: e.target.value as 'all' | 'efectivo' | 'tarjeta' | 'transferencia' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-red-500 focus:ring-red-500"
                    >
                      <option value="all">Todos los métodos</option>
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="tarjeta">💳 Tarjeta</option>
                      <option value="transferencia">📱 Transferencia</option>
                    </select>
                  </div>
                </div>
              </div>

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
                      className="bg-red-600 hover:bg-red-700 text-white px-6"
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

        {/* Modal de egreso */}
        {showEgresoModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeEgresoModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-pink-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {editingEgreso ? 'Editar Egreso' : 'Nuevo Egreso'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {editingEgreso ? 'Modifica los datos del egreso' : 'Registra un nuevo egreso'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={closeEgresoModal}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="px-8 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Receipt className="w-4 h-4 inline mr-2 text-red-600" />
                      Tipo de Egreso <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={egresoType}
                      onChange={(e) => setEgresoType(e.target.value as 'compra' | 'gasto_operativo' | 'servicio' | 'otro')}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-red-500 focus:ring-red-500"
                    >
                      <option value="compra">🛒 Compra</option>
                      <option value="gasto_operativo">⚙️ Gasto Operativo</option>
                      <option value="servicio">🔧 Servicio</option>
                      <option value="otro">📋 Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <DollarSign className="w-4 h-4 inline mr-2 text-red-600" />
                      Monto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={egresoAmount}
                      onChange={(e) => setEgresoAmount(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-red-500 focus:ring-red-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <CreditCard className="w-4 h-4 inline mr-2 text-red-600" />
                      Método de Pago <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={egresoPaymentMethod}
                      onChange={(e) => setEgresoPaymentMethod(e.target.value as 'efectivo' | 'tarjeta' | 'transferencia')}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-red-500 focus:ring-red-500"
                    >
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="tarjeta">💳 Tarjeta</option>
                      <option value="transferencia">📱 Transferencia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Receipt className="w-4 h-4 inline mr-2 text-red-600" />
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={egresoDescription}
                      onChange={(e) => setEgresoDescription(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-red-500 focus:ring-red-500"
                      placeholder="Descripción del egreso"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Building2 className="w-4 h-4 inline mr-2 text-red-600" />
                      Proveedor (opcional)
                    </label>
                    <input
                      type="text"
                      value={egresoSupplier}
                      onChange={(e) => setEgresoSupplier(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-red-500 focus:ring-red-500"
                      placeholder="Nombre del proveedor"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <FileText className="w-4 h-4 inline mr-2 text-red-600" />
                      Número de Factura (opcional)
                    </label>
                    <input
                      type="text"
                      value={egresoInvoiceNumber}
                      onChange={(e) => setEgresoInvoiceNumber(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-red-500 focus:ring-red-500"
                      placeholder="Número de factura"
                    />
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    onClick={closeEgresoModal}
                    variant="outline"
                    className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEgresoSubmit}
                    disabled={isSubmitting || !egresoAmount.trim() || !egresoDescription.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4 mr-2" />
                        {editingEgreso ? 'Actualizar Egreso' : 'Crear Egreso'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
}
