'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { 
  Calculator, 
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
  CheckCircle,
  AlertCircle,
  Receipt,
  TrendingUp,
  TrendingDown,
  Eye,
  RefreshCw
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

interface CajaMovement {
  id: string;
  type: 'apertura' | 'cierre' | 'ingreso' | 'egreso' | 'arqueo';
  amount: number;
  description: string;
  employee_name: string;
  created_at: string;
  reference?: string;
  status: 'pending' | 'completed' | 'cancelled';
}

interface CajaSession {
  id: string;
  employee_name: string;
  initial_amount: number;
  final_amount?: number;
  opened_at: string;
  closed_at?: string;
  status: 'open' | 'closed';
  movements: CajaMovement[];
}

export default function CajaManagementModule() {
  const [sessions, setSessions] = useState<CajaSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<CajaSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');
  
  // Estados para vista (tabla o tarjetas)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Estados para modal de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: 'all' as 'all' | 'open' | 'closed'
  });

  // Estados para modal de apertura/cierre
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionType, setSessionType] = useState<'apertura' | 'cierre'>('apertura');
  const [sessionAmount, setSessionAmount] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);

  // Cargar sesiones de caja
  const loadSessions = async () => {
    try {
      setIsLoading(true);
      // Simular carga de datos
      const mockSessions: CajaSession[] = [
        {
          id: '1',
          employee_name: 'Juan Pérez',
          initial_amount: 100.00,
          final_amount: 1250.50,
          opened_at: '2024-01-15T08:00:00Z',
          closed_at: '2024-01-15T18:00:00Z',
          status: 'closed',
          movements: [
            {
              id: '1',
              type: 'apertura',
              amount: 100.00,
              description: 'Apertura de caja',
              employee_name: 'Juan Pérez',
              created_at: '2024-01-15T08:00:00Z',
              status: 'completed'
            },
            {
              id: '2',
              type: 'ingreso',
              amount: 150.00,
              description: 'Venta mesa 5',
              employee_name: 'Juan Pérez',
              created_at: '2024-01-15T10:30:00Z',
              reference: 'COM-001',
              status: 'completed'
            },
            {
              id: '3',
              type: 'egreso',
              amount: 25.00,
              description: 'Compra ingredientes',
              employee_name: 'Juan Pérez',
              created_at: '2024-01-15T14:15:00Z',
              status: 'completed'
            },
            {
              id: '4',
              type: 'cierre',
              amount: 1250.50,
              description: 'Cierre de caja',
              employee_name: 'Juan Pérez',
              created_at: '2024-01-15T18:00:00Z',
              status: 'completed'
            }
          ]
        },
        {
          id: '2',
          employee_name: 'María García',
          initial_amount: 100.00,
          opened_at: '2024-01-16T08:00:00Z',
          status: 'open',
          movements: [
            {
              id: '5',
              type: 'apertura',
              amount: 100.00,
              description: 'Apertura de caja',
              employee_name: 'María García',
              created_at: '2024-01-16T08:00:00Z',
              status: 'completed'
            },
            {
              id: '6',
              type: 'ingreso',
              amount: 75.00,
              description: 'Venta mesa 3',
              employee_name: 'María García',
              created_at: '2024-01-16T11:45:00Z',
              reference: 'COM-002',
              status: 'completed'
            }
          ]
        }
      ];
      
      setSessions(mockSessions);
      setFilteredSessions(mockSessions);
    } catch (error) {
      console.error('Error cargando sesiones de caja:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar sesiones
  useEffect(() => {
    let filtered = sessions;

    if (searchTerm) {
      filtered = filtered.filter(session =>
        session.employee_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    setFilteredSessions(filtered);
  }, [searchTerm, statusFilter, sessions]);

  // Hook de paginación
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedSessions,
    goToPage
  } = usePagination({ data: filteredSessions || [], itemsPerPage: 10 });

  // Funciones para modal de filtros
  const openFilterModal = () => {
    setActiveFilters({
      status: statusFilter
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setStatusFilter(activeFilters.status);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({ status: 'all' });
    setStatusFilter('all');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.status !== 'all') count++;
    return count;
  };

  // Funciones para modal de sesión
  const openSessionModal = useCallback((type: 'apertura' | 'cierre') => {
    if (createButtonLoading) return;
    
    setCreateButtonLoading(true);
    try {
      setSessionType(type);
      setSessionAmount('');
      setSessionDescription('');
      setShowSessionModal(true);
    } finally {
      setTimeout(() => setCreateButtonLoading(false), 100);
    }
  }, [createButtonLoading]);

  const closeSessionModal = useCallback(() => {
    setShowSessionModal(false);
    setSessionAmount('');
    setSessionDescription('');
  }, []);

  const handleSessionSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    if (!sessionAmount.trim()) {
      alert('El monto es requerido');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Simular creación de sesión
      const newSession: CajaSession = {
        id: Date.now().toString(),
        employee_name: 'Usuario Actual', // En producción vendría del contexto de autenticación
        initial_amount: parseFloat(sessionAmount),
        opened_at: new Date().toISOString(),
        status: sessionType === 'apertura' ? 'open' : 'closed',
        movements: [{
          id: Date.now().toString(),
          type: sessionType,
          amount: parseFloat(sessionAmount),
          description: sessionDescription || (sessionType === 'apertura' ? 'Apertura de caja' : 'Cierre de caja'),
          employee_name: 'Usuario Actual',
          created_at: new Date().toISOString(),
          status: 'completed'
        }]
      };

      setSessions([newSession, ...sessions]);
      setFilteredSessions([newSession, ...filteredSessions]);
      
      alert(`${sessionType === 'apertura' ? 'Caja abierta' : 'Caja cerrada'} exitosamente`);
      closeSessionModal();
    } catch (error) {
      console.error('Error procesando sesión:', error);
      alert('Error procesando la operación');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, sessionAmount, sessionDescription, sessionType, sessions, closeSessionModal]);

  // Cargar datos al montar
  useEffect(() => {
    loadSessions();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Abierta';
      case 'closed': return 'Cerrada';
      default: return 'Desconocido';
    }
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
        {/* Toolbar unificado */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 px-6 pl-12 text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
              <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">
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
              onClick={() => openSessionModal('apertura')}
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
                  Abrir Caja
                </>
              )}
            </Button>
            <Button
              onClick={() => openSessionModal('cierre')}
              disabled={createButtonLoading}
              className="h-12 px-6 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Cerrar Caja
            </Button>
            <Button
              onClick={loadSessions}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Contenido principal */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-900 mt-4 text-lg">Cargando sesiones de caja...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-blue-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Calculator className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || statusFilter !== 'all' ? 'No se encontraron sesiones' : 'No hay sesiones de caja'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {searchTerm || statusFilter !== 'all' 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Comienza abriendo tu primera sesión de caja'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                onClick={() => openSessionModal('apertura')}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Abrir Primera Sesión
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
                      Estado
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto Inicial
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto Final
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Abierta
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cerrada
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-blue-100 rounded-lg mr-4">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{session.employee_name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                          {getStatusText(session.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        {formatCurrency(session.initial_amount)}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        {session.final_amount ? formatCurrency(session.final_amount) : '-'}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        {formatDateTime(session.opened_at)}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        {session.closed_at ? formatDateTime(session.closed_at) : '-'}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                          >
                            <Edit className="w-4 h-4" />
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
            {paginatedSessions.map((session) => (
              <Card key={session.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calculator className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{session.employee_name}</CardTitle>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(session.status)}`}>
                      {getStatusText(session.status)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Monto Inicial</p>
                      <p className="text-sm font-medium text-gray-900">{formatCurrency(session.initial_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Monto Final</p>
                      <p className="text-sm font-medium text-gray-900">
                        {session.final_amount ? formatCurrency(session.final_amount) : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-500">
                    <p>Abierta: {formatDateTime(session.opened_at)}</p>
                    {session.closed_at && (
                      <p>Cerrada: {formatDateTime(session.closed_at)}</p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver Detalles
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginación */}
        {!isLoading && filteredSessions.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredSessions.length}
              itemsPerPage={10}
              onPageChange={goToPage}
              itemType="sesiones"
            />
          </div>
        )}

        {/* Modal de filtros */}
        {showFilterModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Filter className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Filtros de Sesiones de Caja</h2>
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
                  {/* Filtro por Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={activeFilters.status}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value as 'all' | 'open' | 'closed' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="all">Todas las sesiones</option>
                      <option value="open">🟢 Abiertas</option>
                      <option value="closed">⚫ Cerradas</option>
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
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6"
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

        {/* Modal de sesión */}
        {showSessionModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSessionModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className={`px-8 py-6 border-b border-gray-200 ${sessionType === 'apertura' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                : 'bg-gradient-to-r from-red-50 to-pink-50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${sessionType === 'apertura' ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Calculator className={`w-6 h-6 ${sessionType === 'apertura' ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {sessionType === 'apertura' ? 'Abrir Caja' : 'Cerrar Caja'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {sessionType === 'apertura' 
                          ? 'Inicializa una nueva sesión de caja' 
                          : 'Finaliza la sesión actual de caja'
                        }
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={closeSessionModal}
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
                  {/* Monto */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <DollarSign className="w-4 h-4 inline mr-2 text-blue-600" />
                      Monto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={sessionAmount}
                      onChange={(e) => setSessionAmount(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                      placeholder={sessionType === 'apertura' ? 'Monto inicial de caja' : 'Monto final de caja'}
                      required
                    />
                  </div>
                  
                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Receipt className="w-4 h-4 inline mr-2 text-blue-600" />
                      Descripción (opcional)
                    </label>
                    <textarea
                      value={sessionDescription}
                      onChange={(e) => setSessionDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                      placeholder={sessionType === 'apertura' 
                        ? 'Observaciones sobre la apertura de caja...' 
                        : 'Observaciones sobre el cierre de caja...'
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    onClick={closeSessionModal}
                    variant="outline"
                    className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSessionSubmit}
                    disabled={isSubmitting || !sessionAmount.trim()}
                    className={`px-8 py-3 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      sessionType === 'apertura'
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                        : 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Calculator className="w-4 h-4 mr-2" />
                        {sessionType === 'apertura' ? 'Abrir Caja' : 'Cerrar Caja'}
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
