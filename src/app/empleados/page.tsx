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
  User,
  Filter,
  List,
  Grid,
  X,
  UserCheck,
  ChefHat,
  Briefcase
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { EmployeeService, SimpleEmployee } from '@/lib/services/employeeService';
import { usePagination } from '@/hooks/usePagination';

export default function SimpleEmployeesPage() {
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<SimpleEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<'all' | 'mesero' | 'cocinero'>('all');
  
  // Estados para vista (tabla o tarjetas)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  
  // Estados para modal de filtros
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    position: 'all' as 'all' | 'mesero' | 'cocinero'
  });

  // Estados para modal de empleado
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<SimpleEmployee | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [employeePosition, setEmployeePosition] = useState<'mesero' | 'cocinero'>('mesero');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);

  // Cargar empleados
  const loadEmployees = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await EmployeeService.getEmployees();
      
      if (error) {
        console.error('Error cargando empleados:', error);
        toast.error('Error cargando empleados');
        return;
      }
      
      setEmployees(data || []);
      setFilteredEmployees(data || []);
    } catch (error) {
      console.error('Error cargando empleados:', error);
      toast.error('Error cargando empleados');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar empleados
  useEffect(() => {
    let filtered = employees;

    if (searchTerm) {
      filtered = filtered.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (positionFilter !== 'all') {
      filtered = filtered.filter(employee => employee.position === positionFilter);
    }

    setFilteredEmployees(filtered);
  }, [searchTerm, positionFilter, employees]);

  // Hook de paginación
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedEmployees,
    goToPage
  } = usePagination({ data: filteredEmployees || [], itemsPerPage: 10 });

  // Funciones para modal de filtros
  const openFilterModal = () => {
    setActiveFilters({
      position: positionFilter
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => {
    setShowFilterModal(false);
  };

  const applyFilters = () => {
    setPositionFilter(activeFilters.position);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({ position: 'all' });
    setPositionFilter('all');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.position !== 'all') count++;
    return count;
  };

  // Cargar datos al montar
  useEffect(() => {
    loadEmployees();
  }, []);

  // Abrir modal para crear/editar empleado
  const openEmployeeModal = useCallback((employee?: SimpleEmployee) => {
    if (createButtonLoading) return;
    
    setCreateButtonLoading(true);
    try {
      if (employee) {
        setEditingEmployee(employee);
        setEmployeeName(employee.name);
        setEmployeePosition(employee.position);
      } else {
        setEditingEmployee(null);
        setEmployeeName('');
        setEmployeePosition('mesero');
      }
      setShowEmployeeModal(true);
    } finally {
      setTimeout(() => setCreateButtonLoading(false), 100);
    }
  }, [createButtonLoading]);

  // Cerrar modal
  const closeEmployeeModal = useCallback(() => {
    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setEmployeeName('');
    setEmployeePosition('mesero');
  }, []);

  // Guardar empleado
  const handleSaveEmployee = useCallback(async () => {
    if (isSubmitting) return;
    
    if (!employeeName.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    try {
      setIsSubmitting(true);
      
      if (editingEmployee) {
        // Actualizar empleado existente
        const { data, error } = await EmployeeService.updateEmployee(
          editingEmployee.id,
          employeeName.trim(),
          employeePosition
        );
        
        if (error) {
          console.error('Error actualizando empleado:', error);
          toast.error('Error actualizando empleado');
          return;
        }
        
        const updatedEmployees = employees.map(emp =>
          emp.id === editingEmployee.id
            ? { ...emp, name: employeeName.trim(), position: employeePosition }
            : emp
        );
        setEmployees(updatedEmployees);
        setFilteredEmployees(updatedEmployees);
        toast.success('Empleado actualizado exitosamente');
      } else {
        // Crear nuevo empleado
        const { data, error } = await EmployeeService.createEmployee(
          employeeName.trim(),
          employeePosition
        );
        
        if (error) {
          console.error('Error creando empleado:', error);
          toast.error('Error creando empleado');
          return;
        }
        
        if (data) {
          setEmployees([data, ...employees]);
          setFilteredEmployees([data, ...filteredEmployees]);
          toast.success('Empleado creado exitosamente');
        }
      }
      
      closeEmployeeModal();
    } catch (error) {
      console.error('Error guardando empleado:', error);
      toast.error('Error guardando empleado');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, employeeName, employeePosition, editingEmployee, employees, closeEmployeeModal]);

  // Eliminar empleado
  const handleDeleteEmployee = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este empleado?')) {
      try {
        const { error } = await EmployeeService.deleteEmployee(id);
        
        if (error) {
          console.error('Error eliminando empleado:', error);
          toast.error('Error eliminando empleado');
          return;
        }
        
        const updatedEmployees = employees.filter(emp => emp.id !== id);
        setEmployees(updatedEmployees);
        setFilteredEmployees(updatedEmployees);
        toast.success('Empleado eliminado exitosamente');
      } catch (error) {
        console.error('Error eliminando empleado:', error);
        toast.error('Error eliminando empleado');
      }
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
        {/* Encabezado contextual (Operaciones) */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Empleados (Operaciones)</h1>
          <p className="text-gray-600">Gestión operativa básica del personal: nombre y posición</p>
        </div>
        {/* Toolbar unificado */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Búsqueda */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar empleados..."
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
            onClick={() => openEmployeeModal()}
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
                Nuevo Empleado
              </>
            )}
          </Button>
        </div>

        {/* Contenido principal */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-900 mt-4 text-lg">Cargando empleados...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-green-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Users className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || positionFilter !== 'all' ? 'No se encontraron empleados' : 'No hay empleados registrados'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {searchTerm || positionFilter !== 'all' 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Comienza agregando tu primer empleado'
              }
            </p>
            {!searchTerm && positionFilter === 'all' && (
              <Button
                onClick={() => openEmployeeModal()}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 text-lg shadow-lg"
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
                      Registrado
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-100 rounded-lg mr-4">
                            <User className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          employee.position === 'mesero' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {employee.position === 'mesero' ? (
                            <>
                              <UserCheck className="w-3 h-3 mr-1" />
                              Mesero
                            </>
                          ) : (
                            <>
                              <ChefHat className="w-3 h-3 mr-1" />
                              Cocinero
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        {new Date(employee.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEmployeeModal(employee)}
                            className="text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEmployee(employee.id)}
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
            {paginatedEmployees.map((employee) => (
              <Card key={employee.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{employee.name}</CardTitle>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      employee.position === 'mesero' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {employee.position === 'mesero' ? (
                        <>
                          <UserCheck className="w-3 h-3 mr-1" />
                          Mesero
                        </>
                      ) : (
                        <>
                          <ChefHat className="w-3 h-3 mr-1" />
                          Cocinero
                        </>
                      )}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="text-xs text-gray-500">
                    Registrado: {new Date(employee.created_at).toLocaleDateString()}
                  </div>

                  {/* Acciones */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEmployeeModal(employee)}
                      className="flex-1 text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteEmployee(employee.id)}
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
        {!isLoading && filteredEmployees.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredEmployees.length}
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
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Filter className="w-6 h-6 text-green-600" />
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

              {/* Contenido */}
              <div className="px-8 py-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  {/* Filtro por Posición */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Posición
                    </label>
                    <select
                      value={activeFilters.position}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, position: e.target.value as 'all' | 'mesero' | 'cocinero' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                    >
                      <option value="all">Todas las posiciones</option>
                      <option value="mesero">👨‍💼 Meseros</option>
                      <option value="cocinero">👨‍🍳 Cocineros</option>
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

        {/* Modal de empleado */}
        {showEmployeeModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeEmployeeModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {editingEmployee ? 'Modifica los datos del empleado' : 'Completa la información del nuevo empleado'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={closeEmployeeModal}
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
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <User className="w-4 h-4 inline mr-2 text-green-600" />
                      Nombre del Empleado <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={employeeName}
                      onChange={(e) => setEmployeeName(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                      placeholder="Ingresa el nombre completo"
                      required
                    />
                  </div>
                  
                  {/* Posición */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Briefcase className="w-4 h-4 inline mr-2 text-green-600" />
                      Posición <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={employeePosition}
                      onChange={(e) => setEmployeePosition(e.target.value as 'mesero' | 'cocinero')}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                    >
                      <option value="mesero">👨‍💼 Mesero</option>
                      <option value="cocinero">👨‍🍳 Cocinero</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    onClick={closeEmployeeModal}
                    variant="outline"
                    className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveEmployee}
                    disabled={isSubmitting || !employeeName.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        {editingEmployee ? 'Actualizar Empleado' : 'Crear Empleado'}
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
