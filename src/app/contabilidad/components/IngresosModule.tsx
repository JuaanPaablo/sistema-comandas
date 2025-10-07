'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { 
  TrendingUp, 
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
  Calendar,
  BarChart3
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

interface Ingreso {
  id: string;
  type: 'venta' | 'propina' | 'comision' | 'otro';
  amount: number;
  payment_method: 'efectivo' | 'tarjeta' | 'transferencia';
  description: string;
  employee_name: string;
  table_number?: string;
  comanda_id?: string;
  created_at: string;
  status: 'pending' | 'completed' | 'cancelled';
}

export default function IngresosModule() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [filteredIngresos, setFilteredIngresos] = useState<Ingreso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'venta' | 'propina' | 'comision' | 'otro'>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'efectivo' | 'tarjeta' | 'transferencia'>('all');
  
  // Estados para vista (tabla o tarjetas)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Estados para modal de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    type: 'all' as 'all' | 'venta' | 'propina' | 'comision' | 'otro',
    payment_method: 'all' as 'all' | 'efectivo' | 'tarjeta' | 'transferencia'
  });

  // Estados para modal de ingreso
  const [showIngresoModal, setShowIngresoModal] = useState(false);
  const [editingIngreso, setEditingIngreso] = useState<Ingreso | null>(null);
  const [ingresoType, setIngresoType] = useState<'venta' | 'propina' | 'comision' | 'otro'>('venta');
  const [ingresoAmount, setIngresoAmount] = useState('');
  const [ingresoPaymentMethod, setIngresoPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
  const [ingresoDescription, setIngresoDescription] = useState('');
  const [ingresoTableNumber, setIngresoTableNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);

  // Cargar ingresos
  const loadIngresos = async () => {
    try {
      setIsLoading(true);
      // Simular carga de datos
      const mockIngresos: Ingreso[] = [
        {
          id: '1',
          type: 'venta',
          amount: 25.50,
          payment_method: 'efectivo',
          description: 'Venta mesa 5',
          employee_name: 'Juan Pérez',
          table_number: '5',
          comanda_id: 'COM-001',
          created_at: '2024-01-15T10:30:00Z',
          status: 'completed'
        },
        {
          id: '2',
          type: 'venta',
          amount: 45.00,
          payment_method: 'tarjeta',
          description: 'Venta mesa 3',
          employee_name: 'María García',
          table_number: '3',
          comanda_id: 'COM-002',
          created_at: '2024-01-15T11:45:00Z',
          status: 'completed'
        },
        {
          id: '3',
          type: 'propina',
          amount: 5.00,
          payment_method: 'efectivo',
          description: 'Propina mesa 5',
          employee_name: 'Juan Pérez',
          table_number: '5',
          created_at: '2024-01-15T12:00:00Z',
          status: 'completed'
        },
        {
          id: '4',
          type: 'venta',
          amount: 32.75,
          payment_method: 'transferencia',
          description: 'Venta mesa 8',
          employee_name: 'Carlos López',
          table_number: '8',
          comanda_id: 'COM-003',
          created_at: '2024-01-15T14:20:00Z',
          status: 'completed'
        },
        {
          id: '5',
          type: 'comision',
          amount: 2.25,
          payment_method: 'efectivo',
          description: 'Comisión por venta',
          employee_name: 'María García',
          created_at: '2024-01-15T15:30:00Z',
          status: 'completed'
        }
      ];
      
      setIngresos(mockIngresos);
      setFilteredIngresos(mockIngresos);
    } catch (error) {
      console.error('Error cargando ingresos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar ingresos
  useEffect(() => {
    let filtered = ingresos;

    if (searchTerm) {
      filtered = filtered.filter(ingreso =>
        ingreso.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingreso.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ingreso.table_number && ingreso.table_number.includes(searchTerm))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(ingreso => ingreso.type === typeFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(ingreso => ingreso.payment_method === paymentFilter);
    }

    setFilteredIngresos(filtered);
  }, [searchTerm, typeFilter, paymentFilter, ingresos]);

  // Hook de paginación
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedIngresos,
    goToPage
  } = usePagination({ data: filteredIngresos || [], itemsPerPage: 10 });

  // Funciones para modal de filtros
  const openFilterModal = () => {
    setActiveFilters({
      type: typeFilter,
      payment_method: paymentFilter
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

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

  // Funciones para modal de ingreso
  const openIngresoModal = useCallback((ingreso?: Ingreso) => {
    if (createButtonLoading) return;
    
    setCreateButtonLoading(true);
    try {
      if (ingreso) {
        setEditingIngreso(ingreso);
        setIngresoType(ingreso.type);
        setIngresoAmount(ingreso.amount.toString());
        setIngresoPaymentMethod(ingreso.payment_method);
        setIngresoDescription(ingreso.description);
        setIngresoTableNumber(ingreso.table_number || '');
      } else {
        setEditingIngreso(null);
        setIngresoType('venta');
        setIngresoAmount('');
        setIngresoPaymentMethod('efectivo');
        setIngresoDescription('');
        setIngresoTableNumber('');
      }
      setShowIngresoModal(true);
    } finally {
      setTimeout(() => setCreateButtonLoading(false), 100);
    }
  }, [createButtonLoading]);

  const closeIngresoModal = useCallback(() => {
    setShowIngresoModal(false);
    setEditingIngreso(null);
    setIngresoAmount('');
    setIngresoDescription('');
    setIngresoTableNumber('');
  }, []);

  const handleIngresoSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    if (!ingresoAmount.trim()) {
      alert('El monto es requerido');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const ingresoData: Ingreso = {
        id: editingIngreso?.id || Date.now().toString(),
        type: ingresoType,
        amount: parseFloat(ingresoAmount),
        payment_method: ingresoPaymentMethod,
        description: ingresoDescription,
        employee_name: 'Usuario Actual', // En producción vendría del contexto de autenticación
        table_number: ingresoTableNumber || undefined,
        created_at: editingIngreso?.created_at || new Date().toISOString(),
        status: 'completed'
      };

      if (editingIngreso) {
        const updatedIngresos = ingresos.map(ingreso =>
          ingreso.id === editingIngreso.id ? ingresoData : ingreso
        );
        setIngresos(updatedIngresos);
        setFilteredIngresos(updatedIngresos);
        alert('Ingreso actualizado exitosamente');
      } else {
        setIngresos([ingresoData, ...ingresos]);
        setFilteredIngresos([ingresoData, ...filteredIngresos]);
        alert('Ingreso creado exitosamente');
      }
      
      closeIngresoModal();
    } catch (error) {
      console.error('Error procesando ingreso:', error);
      alert('Error procesando el ingreso');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, ingresoAmount, ingresoType, ingresoPaymentMethod, ingresoDescription, ingresoTableNumber, editingIngreso, ingresos, closeIngresoModal]);

  // Cargar datos al montar
  useEffect(() => {
    loadIngresos();
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
      case 'venta': return 'bg-green-100 text-green-800';
      case 'propina': return 'bg-blue-100 text-blue-800';
      case 'comision': return 'bg-purple-100 text-purple-800';
      case 'otro': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'venta': return 'Venta';
      case 'propina': return 'Propina';
      case 'comision': return 'Comisión';
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

  // Calcular totales
  const totalIngresos = filteredIngresos.reduce((sum, ingreso) => sum + ingreso.amount, 0);
  const totalVentas = filteredIngresos.filter(i => i.type === 'venta').reduce((sum, ingreso) => sum + ingreso.amount, 0);
  const totalPropinas = filteredIngresos.filter(i => i.type === 'propina').reduce((sum, ingreso) => sum + ingreso.amount, 0);

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
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por descripción, empleado o mesa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 px-6 pl-12 text-gray-900 border-gray-300 focus:border-green-500 focus:ring-green-500"
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
              <span className="ml-2 bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
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
          <Button
            onClick={() => openIngresoModal()}
            disabled={createButtonLoading}
            className="h-12 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createButtonLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Abriendo...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Ingreso
              </>
            )}
          </Button>
          <Button
            onClick={loadIngresos}
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
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Ingresos</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalIngresos)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Ventas</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalVentas)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Propinas</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPropinas)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contenido principal */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-900 mt-4 text-lg">Cargando ingresos...</p>
          </div>
        ) : filteredIngresos.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-green-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <TrendingUp className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || typeFilter !== 'all' || paymentFilter !== 'all' ? 'No se encontraron ingresos' : 'No hay ingresos registrados'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {searchTerm || typeFilter !== 'all' || paymentFilter !== 'all' 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Comienza registrando tu primer ingreso'
              }
            </p>
            {!searchTerm && typeFilter === 'all' && paymentFilter === 'all' && (
              <Button
                onClick={() => openIngresoModal()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Registrar Primer Ingreso
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
                      Empleado
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mesa
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
                  {paginatedIngresos.map((ingreso) => (
                    <tr key={ingreso.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(ingreso.type)}`}>
                          {getTypeText(ingreso.type)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ingreso.description}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{ingreso.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        {ingreso.table_number || '-'}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`mr-2 ${getPaymentColor(ingreso.payment_method)}`}>
                            {getPaymentIcon(ingreso.payment_method)}
                          </div>
                          <span className="text-sm text-gray-900 capitalize">{ingreso.payment_method}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(ingreso.amount)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDateTime(ingreso.created_at)}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openIngresoModal(ingreso)}
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
            {paginatedIngresos.map((ingreso) => (
              <Card key={ingreso.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{ingreso.description}</CardTitle>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(ingreso.type)}`}>
                      {getTypeText(ingreso.type)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>{ingreso.employee_name}</span>
                  </div>
                  
                  {ingreso.table_number && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Receipt className="w-4 h-4 mr-2" />
                      <span>Mesa {ingreso.table_number}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <div className={`mr-2 ${getPaymentColor(ingreso.payment_method)}`}>
                      {getPaymentIcon(ingreso.payment_method)}
                    </div>
                    <span className="capitalize">{ingreso.payment_method}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{formatDateTime(ingreso.created_at)}</span>
                  </div>

                  <div className="text-center">
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(ingreso.amount)}
                    </span>
                  </div>

                  {/* Acciones */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openIngresoModal(ingreso)}
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
        {!isLoading && filteredIngresos.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredIngresos.length}
              itemsPerPage={10}
              onPageChange={goToPage}
              itemType="ingresos"
            />
          </div>
        )}

        {/* Modal de filtros */}
        {showFilterModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Filter className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Filtros de Ingresos</h2>
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
                  {/* Filtro por Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Ingreso
                    </label>
                    <select
                      value={activeFilters.type}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, type: e.target.value as 'all' | 'venta' | 'propina' | 'comision' | 'otro' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                    >
                      <option value="all">Todos los tipos</option>
                      <option value="venta">💰 Ventas</option>
                      <option value="propina">💸 Propinas</option>
                      <option value="comision">📈 Comisiones</option>
                      <option value="otro">📋 Otros</option>
                    </select>
                  </div>

                  {/* Filtro por Método de Pago */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Método de Pago
                    </label>
                    <select
                      value={activeFilters.payment_method}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, payment_method: e.target.value as 'all' | 'efectivo' | 'tarjeta' | 'transferencia' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                    >
                      <option value="all">Todos los métodos</option>
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="tarjeta">💳 Tarjeta</option>
                      <option value="transferencia">📱 Transferencia</option>
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
                      className="bg-green-600 hover:bg-green-700 text-white px-6"
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

        {/* Modal de ingreso */}
        {showIngresoModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeIngresoModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {editingIngreso ? 'Editar Ingreso' : 'Nuevo Ingreso'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {editingIngreso ? 'Modifica los datos del ingreso' : 'Registra un nuevo ingreso'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={closeIngresoModal}
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
                  {/* Tipo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Receipt className="w-4 h-4 inline mr-2 text-green-600" />
                      Tipo de Ingreso <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={ingresoType}
                      onChange={(e) => setIngresoType(e.target.value as 'venta' | 'propina' | 'comision' | 'otro')}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                    >
                      <option value="venta">💰 Venta</option>
                      <option value="propina">💸 Propina</option>
                      <option value="comision">📈 Comisión</option>
                      <option value="otro">📋 Otro</option>
                    </select>
                  </div>

                  {/* Monto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <DollarSign className="w-4 h-4 inline mr-2 text-green-600" />
                      Monto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={ingresoAmount}
                      onChange={(e) => setIngresoAmount(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  {/* Método de Pago */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <CreditCard className="w-4 h-4 inline mr-2 text-green-600" />
                      Método de Pago <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={ingresoPaymentMethod}
                      onChange={(e) => setIngresoPaymentMethod(e.target.value as 'efectivo' | 'tarjeta' | 'transferencia')}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                    >
                      <option value="efectivo">💵 Efectivo</option>
                      <option value="tarjeta">💳 Tarjeta</option>
                      <option value="transferencia">📱 Transferencia</option>
                    </select>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Receipt className="w-4 h-4 inline mr-2 text-green-600" />
                      Descripción <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={ingresoDescription}
                      onChange={(e) => setIngresoDescription(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                      placeholder="Descripción del ingreso"
                      required
                    />
                  </div>

                  {/* Mesa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Receipt className="w-4 h-4 inline mr-2 text-green-600" />
                      Mesa (opcional)
                    </label>
                    <input
                      type="text"
                      value={ingresoTableNumber}
                      onChange={(e) => setIngresoTableNumber(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                      placeholder="Número de mesa"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    onClick={closeIngresoModal}
                    variant="outline"
                    className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleIngresoSubmit}
                    disabled={isSubmitting || !ingresoAmount.trim() || !ingresoDescription.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {editingIngreso ? 'Actualizar Ingreso' : 'Crear Ingreso'}
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
