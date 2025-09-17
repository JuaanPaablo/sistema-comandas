'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  User
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { EmployeeService, SimpleEmployee } from '@/lib/services/employeeService';

export default function SimpleEmployeesPage() {
  const [employees, setEmployees] = useState<SimpleEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<SimpleEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<SimpleEmployee | null>(null);
  const [employeeName, setEmployeeName] = useState('');
  const [employeePosition, setEmployeePosition] = useState<'mesero' | 'cocinero'>('mesero');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (searchTerm) {
      const filtered = employees.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(employees);
    }
  }, [searchTerm, employees]);

  // Cargar datos al montar
  useEffect(() => {
    loadEmployees();
  }, []);

  // Abrir modal para crear/editar empleado
  const openEmployeeModal = (employee?: SimpleEmployee) => {
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
  };

  // Cerrar modal
  const closeEmployeeModal = () => {
    setShowEmployeeModal(false);
    setEditingEmployee(null);
    setEmployeeName('');
    setEmployeePosition('mesero');
  };

  // Guardar empleado
  const handleSaveEmployee = async () => {
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
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">👥 Empleados</h1>
              <p className="text-gray-600 mt-2">
                Gestión simple del personal
              </p>
            </div>
            
            <Button onClick={() => openEmployeeModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Empleado
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        {/* Búsqueda */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Buscar empleados..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Lista de empleados */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-900 mt-2">Cargando empleados...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron empleados' : 'No hay empleados registrados'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Intenta con otro término de búsqueda'
                  : 'Comienza agregando tu primer empleado'
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => openEmployeeModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Empleado
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredEmployees.map((employee) => (
              <Card key={employee.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {employee.name}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {employee.position}
                        </p>
                        <p className="text-xs text-gray-500">
                          Registrado: {new Date(employee.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEmployeeModal(employee)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Modal de empleado */}
      <Modal
        isOpen={showEmployeeModal}
        onClose={closeEmployeeModal}
        title={editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Empleado
            </label>
            <Input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Ingresa el nombre completo"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Posición
            </label>
            <select
              value={employeePosition}
              onChange={(e) => setEmployeePosition(e.target.value as 'mesero' | 'cocinero')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mesero">Mesero</option>
              <option value="cocinero">Cocinero</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={closeEmployeeModal}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveEmployee}
            disabled={isSubmitting || !employeeName.trim()}
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
