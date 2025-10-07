'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { 
  Users, 
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
  Calculator,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Calendar,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

interface EmpleadoContabilidad {
  id: string;
  name: string;
  position: string;
  salary: number;
  commission_rate: number;
  start_date: string;
  status: 'active' | 'inactive';
  total_commission: number;
  last_payment: string;
  payment_method: 'cash' | 'bank_transfer' | 'check';
}

export default function EmpleadosContabilidadModule() {
  const [empleados, setEmpleados] = useState<EmpleadoContabilidad[]>([]);
  const [filteredEmpleados, setFilteredEmpleados] = useState<EmpleadoContabilidad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<'all' | 'mesero' | 'cocinero' | 'cajero' | 'gerente'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    position: 'all' as 'all' | 'mesero' | 'cocinero' | 'cajero' | 'gerente',
    status: 'all' as 'all' | 'active' | 'inactive'
  });

  const [showEmpleadoModal, setShowEmpleadoModal] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState<EmpleadoContabilidad | null>(null);
  const [empleadoName, setEmpleadoName] = useState('');
  const [empleadoPosition, setEmpleadoPosition] = useState<'mesero' | 'cocinero' | 'cajero' | 'gerente'>('mesero');
  const [empleadoSalary, setEmpleadoSalary] = useState('');
  const [empleadoCommission, setEmpleadoCommission] = useState('');
  const [empleadoPaymentMethod, setEmpleadoPaymentMethod] = useState<'cash' | 'bank_transfer' | 'check'>('cash');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);

  const loadEmpleados = async () => {
    try {
      setIsLoading(true);
      const mockEmpleados: EmpleadoContabilidad[] = [
        {
          id: '1',
          name: 'María García',
          position: 'mesero',
          salary: 800.00,
          commission_rate: 5.0,
          start_date: '2023-01-15',
          status: 'active',
          total_commission: 1250.50,
          last_payment: '2024-01-15',
          payment_method: 'bank_transfer'
        },
        {
          id: '2',
          name: 'Juan Pérez',
          position: 'cocinero',
          salary: 1000.00,
          commission_rate: 3.0,
          start_date: '2023-03-10',
          status: 'active',
          total_commission: 890.25,
          last_payment: '2024-01-15',
          payment_method: 'cash'
        },
        {
          id: '3',
          name: 'Carlos López',
          position: 'cajero',
          salary: 900.00,
          commission_rate: 2.5,
          start_date: '2023-06-20',
          status: 'active',
          total_commission: 675.80,
          last_payment: '2024-01-15',
          payment_method: 'check'
        },
        {
          id: '4',
          name: 'Ana Martínez',
          position: 'gerente',
          salary: 1500.00,
          commission_rate: 8.0,
          start_date: '2022-11-01',
          status: 'active',
          total_commission: 2100.00,
          last_payment: '2024-01-15',
          payment_method: 'bank_transfer'
        }
      ];
      
      setEmpleados(mockEmpleados);
      setFilteredEmpleados(mockEmpleados);
    } catch (error) {
      console.error('Error cargando empleados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = empleados;

    if (searchTerm) {
      filtered = filtered.filter(empleado =>
        empleado.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        empleado.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (positionFilter !== 'all') {
      filtered = filtered.filter(empleado => empleado.position === positionFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(empleado => empleado.status === statusFilter);
    }

    setFilteredEmpleados(filtered);
  }, [searchTerm, positionFilter, statusFilter, empleados]);

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedEmpleados,
    goToPage
  } = usePagination({ data: filteredEmpleados || [], itemsPerPage: 10 });

  const openFilterModal = () => {
    setActiveFilters({
      position: positionFilter,
      status: statusFilter
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => setShowFilterModal(false);

  const applyFilters = () => {
    setPositionFilter(activeFilters.position);
    setStatusFilter(activeFilters.status);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({ position: 'all', status: 'all' });
    setPositionFilter('all');
    setStatusFilter('all');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.position !== 'all') count++;
    if (activeFilters.status !== 'all') count++;
    return count;
  };

  const openEmpleadoModal = useCallback((empleado?: EmpleadoContabilidad) => {
    if (createButtonLoading) return;
    
    setCreateButtonLoading(true);
    try {
      if (empleado) {
        setEditingEmpleado(empleado);
        setEmpleadoName(empleado.name);
        setEmpleadoPosition(empleado.position);
        setEmpleadoSalary(empleado.salary.toString());
        setEmpleadoCommission(empleado.commission_rate.toString());
        setEmpleadoPaymentMethod(empleado.payment_method);
      } else {
        setEditingEmpleado(null);
        setEmpleadoName('');
        setEmpleadoPosition('mesero');
        setEmpleadoSalary('');
        setEmpleadoCommission('');
        setEmpleadoPaymentMethod('cash');
      }
      setShowEmpleadoModal(true);
    } finally {
      setTimeout(() => setCreateButtonLoading(false), 100);
    }
  }, [createButtonLoading]);

  const closeEmpleadoModal = useCallback(() => {
    setShowEmpleadoModal(false);
    setEditingEmpleado(null);
    setEmpleadoName('');
    setEmpleadoSalary('');
    setEmpleadoCommission('');
  }, []);

  const handleEmpleadoSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    if (!empleadoName.trim() || !empleadoSalary.trim() || !empleadoCommission.trim()) {
      alert('Todos los campos son requeridos');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const empleadoData: EmpleadoContabilidad = {
        id: editingEmpleado?.id || Date.now().toString(),
        name: empleadoName,
        position: empleadoPosition,
        salary: parseFloat(empleadoSalary),
        commission_rate: parseFloat(empleadoCommission),
        start_date: editingEmpleado?.start_date || new Date().toISOString().split('T')[0],
        status: 'active',
        total_commission: editingEmpleado?.total_commission || 0,
        last_payment: editingEmpleado?.last_payment || new Date().toISOString().split('T')[0],
        payment_method: empleadoPaymentMethod
      };

      if (editingEmpleado) {
        const updatedEmpleados = empleados.map(empleado =>
          empleado.id === editingEmpleado.id ? empleadoData : empleado
        );
        setEmpleados(updatedEmpleados);
        setFilteredEmpleados(updatedEmpleados);
        alert('Empleado actualizado exitosamente');
      } else {
        setEmpleados([empleadoData, ...empleados]);
        setFilteredEmpleados([empleadoData, ...filteredEmpleados]);
        alert('Empleado creado exitosamente');
      }
      
      closeEmpleadoModal();
    } catch (error) {
      console.error('Error procesando empleado:', error);
      alert('Error procesando el empleado');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, empleadoName, empleadoPosition, empleadoSalary, empleadoCommission, empleadoPaymentMethod, editingEmpleado, empleados, closeEmpleadoModal]);

  const handleDelete = (empleado: EmpleadoContabilidad) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${empleado.name}?`)) {
      const updatedEmpleados = empleados.filter(e => e.id !== empleado.id);
      setEmpleados(updatedEmpleados);
      setFilteredEmpleados(updatedEmpleados);
      alert('Empleado eliminado exitosamente');
    }
  };

  useEffect(() => {
    loadEmpleados();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getPositionText = (position: string) => {
    switch (position) {
      case 'mesero': return 'Mesero';
      case 'cocinero': return 'Cocinero';
      case 'cajero': return 'Cajero';
      case 'gerente': return 'Gerente';
      default: return 'Desconocido';
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'mesero': return 'bg-blue-100 text-blue-800';
      case 'cocinero': return 'bg-orange-100 text-orange-800';
      case 'cajero': return 'bg-green-100 text-green-800';
      case 'gerente': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      default: return 'Desconocido';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'bank_transfer': return 'Transferencia';
      case 'check': return 'Cheque';
      default: return 'Desconocido';
    }
  };

  const totalEmpleados = filteredEmpleados.length;
  const totalActivos = filteredEmpleados.filter(e => e.status === 'active').length;
  const totalComisiones = filteredEmpleados.reduce((sum, e) => sum + e.total_commission, 0);

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
              placeholder="Buscar por nombre o posición..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 px-6 pl-12 text-gray-900 border-gray-300 focus:border-yellow-500 focus:ring-yellow-500"
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
              <span className="ml-2 bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full">
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
            onClick={() => openEmpleadoModal()}
            disabled={createButtonLoading}
            className="h-12 px-6 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createButtonLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Abriendo...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Empleado
              </>
            )}
          </Button>
          <Button
            onClick={loadEmpleados}
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
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-900">{totalEmpleados}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-2xl font-bold text-gray-900">{totalActivos}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Comisiones</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalComisiones)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contenido principal */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
            <p className="text-gray-900 mt-4 text-lg">Cargando empleados...</p>
          </div>
        ) : filteredEmpleados.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-yellow-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Users className="w-12 h-12 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || positionFilter !== 'all' || statusFilter !== 'all' ? 'No se encontraron empleados' : 'No hay empleados registrados'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {searchTerm || positionFilter !== 'all' || statusFilter !== 'all' 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Comienza agregando tu primer empleado'
              }
            </p>
            {!searchTerm && positionFilter === 'all' && statusFilter === 'all' && (
              <Button
                onClick={() => openEmpleadoModal()}
                className="bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white px-8 py-3 text-lg shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar Primer Empleado
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
                      Empleado
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posición
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Salario
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comisión
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Comisiones
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEmpleados.map((empleado) => (
                    <tr key={empleado.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                            <User className="w-5 h-5 text-yellow-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{empleado.name}</div>
                            <div className="text-sm text-gray-500">Desde: {formatDate(empleado.start_date)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPositionColor(empleado.position)}`}>
                          {getPositionText(empleado.position)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-lg font-bold text-yellow-600">
                          {formatCurrency(empleado.salary)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        {empleado.commission_rate}%
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-lg font-bold text-green-600">
                          {formatCurrency(empleado.total_commission)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(empleado.status)}`}>
                          {getStatusText(empleado.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEmpleadoModal(empleado)}
                            className="text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(empleado)}
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
            {paginatedEmpleados.map((empleado) => (
              <Card key={empleado.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <User className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{empleado.name}</CardTitle>
                        <p className="text-sm text-gray-500">{getPositionText(empleado.position)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(empleado.status)}`}>
                      {getStatusText(empleado.status)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Salario Base</p>
                      <p className="text-lg font-bold text-yellow-600">
                        {formatCurrency(empleado.salary)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Comisión</p>
                      <p className="text-lg font-bold text-blue-600">
                        {empleado.commission_rate}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500">Total Comisiones</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatCurrency(empleado.total_commission)}
                    </p>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Desde: {formatDate(empleado.start_date)}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <CreditCard className="w-4 h-4 mr-2" />
                    <span>{getPaymentMethodText(empleado.payment_method)}</span>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEmpleadoModal(empleado)}
                      className="flex-1 text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(empleado)}
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
        {!isLoading && filteredEmpleados.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredEmpleados.length}
              itemsPerPage={10}
              onPageChange={goToPage}
              itemType="empleados"
            />
          </div>
        )}

        {/* Modal de filtros */}
        {showFilterModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Filter className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Filtros de Empleados</h2>
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
                      Posición
                    </label>
                    <select
                      value={activeFilters.position}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, position: e.target.value as 'all' | 'mesero' | 'cocinero' | 'cajero' | 'gerente' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-yellow-500 focus:ring-yellow-500"
                    >
                      <option value="all">Todas las posiciones</option>
                      <option value="mesero">🍽️ Mesero</option>
                      <option value="cocinero">👨‍🍳 Cocinero</option>
                      <option value="cajero">💰 Cajero</option>
                      <option value="gerente">👔 Gerente</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={activeFilters.status}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value as 'all' | 'active' | 'inactive' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-yellow-500 focus:ring-yellow-500"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="active">✅ Activo</option>
                      <option value="inactive">❌ Inactivo</option>
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

        {/* Modal de empleado */}
        {showEmpleadoModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeEmpleadoModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Users className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {editingEmpleado ? 'Editar Empleado' : 'Nuevo Empleado'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {editingEmpleado ? 'Modifica los datos del empleado' : 'Agrega un nuevo empleado al sistema'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={closeEmpleadoModal}
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
                      <User className="w-4 h-4 inline mr-2 text-yellow-600" />
                      Nombre del Empleado <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={empleadoName}
                      onChange={(e) => setEmpleadoName(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-yellow-500 focus:ring-yellow-500"
                      placeholder="Nombre completo"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Briefcase className="w-4 h-4 inline mr-2 text-yellow-600" />
                      Posición <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={empleadoPosition}
                      onChange={(e) => setEmpleadoPosition(e.target.value as 'mesero' | 'cocinero' | 'cajero' | 'gerente')}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-yellow-500 focus:ring-yellow-500"
                    >
                      <option value="mesero">🍽️ Mesero</option>
                      <option value="cocinero">👨‍🍳 Cocinero</option>
                      <option value="cajero">💰 Cajero</option>
                      <option value="gerente">👔 Gerente</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-3">
                        <DollarSign className="w-4 h-4 inline mr-2 text-yellow-600" />
                        Salario Base <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={empleadoSalary}
                        onChange={(e) => setEmpleadoSalary(e.target.value)}
                        className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-yellow-500 focus:ring-yellow-500"
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-3">
                        <Calculator className="w-4 h-4 inline mr-2 text-yellow-600" />
                        Comisión (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={empleadoCommission}
                        onChange={(e) => setEmpleadoCommission(e.target.value)}
                        className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-yellow-500 focus:ring-yellow-500"
                        placeholder="0.0"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <CreditCard className="w-4 h-4 inline mr-2 text-yellow-600" />
                      Método de Pago
                    </label>
                    <select
                      value={empleadoPaymentMethod}
                      onChange={(e) => setEmpleadoPaymentMethod(e.target.value as 'cash' | 'bank_transfer' | 'check')}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-yellow-500 focus:ring-yellow-500"
                    >
                      <option value="cash">💵 Efectivo</option>
                      <option value="bank_transfer">🏦 Transferencia Bancaria</option>
                      <option value="check">📄 Cheque</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    onClick={closeEmpleadoModal}
                    variant="outline"
                    className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleEmpleadoSubmit}
                    disabled={isSubmitting || !empleadoName.trim() || !empleadoSalary.trim() || !empleadoCommission.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        {editingEmpleado ? 'Actualizar Empleado' : 'Crear Empleado'}
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
