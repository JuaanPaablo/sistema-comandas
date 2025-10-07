'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { 
  Building2, 
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
  Phone,
  Mail,
  MapPin,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Calendar,
  Package
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

interface Proveedor {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  payment_terms: string;
  status: 'active' | 'inactive';
  total_purchases: number;
  pending_amount: number;
  last_purchase: string;
  created_at: string;
}

export default function ProveedoresModule() {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [filteredProveedores, setFilteredProveedores] = useState<Proveedor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: 'all' as 'all' | 'active' | 'inactive'
  });

  const [showProveedorModal, setShowProveedorModal] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [proveedorName, setProveedorName] = useState('');
  const [proveedorContact, setProveedorContact] = useState('');
  const [proveedorEmail, setProveedorEmail] = useState('');
  const [proveedorPhone, setProveedorPhone] = useState('');
  const [proveedorAddress, setProveedorAddress] = useState('');
  const [proveedorPaymentTerms, setProveedorPaymentTerms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);

  const loadProveedores = async () => {
    try {
      setIsLoading(true);
      const mockProveedores: Proveedor[] = [
        {
          id: '1',
          name: 'Distribuidora ABC',
          contact_person: 'Carlos Mendoza',
          email: 'carlos@distribuidoraabc.com',
          phone: '+593 99 123 4567',
          address: 'Av. Principal 123, Quito',
          payment_terms: '30 días',
          status: 'active',
          total_purchases: 15000.00,
          pending_amount: 2500.00,
          last_purchase: '2024-01-10',
          created_at: '2023-01-15'
        },
        {
          id: '2',
          name: 'Proveedor XYZ',
          contact_person: 'María González',
          email: 'maria@proveedorxyz.com',
          phone: '+593 98 765 4321',
          address: 'Calle Secundaria 456, Guayaquil',
          payment_terms: '15 días',
          status: 'active',
          total_purchases: 8500.00,
          pending_amount: 1200.00,
          last_purchase: '2024-01-12',
          created_at: '2023-03-20'
        },
        {
          id: '3',
          name: 'Suministros del Norte',
          contact_person: 'Roberto Silva',
          email: 'roberto@suministrosnorte.com',
          phone: '+593 97 654 3210',
          address: 'Plaza Central 789, Cuenca',
          payment_terms: '45 días',
          status: 'active',
          total_purchases: 22000.00,
          pending_amount: 0.00,
          last_purchase: '2024-01-08',
          created_at: '2022-11-10'
        }
      ];
      
      setProveedores(mockProveedores);
      setFilteredProveedores(mockProveedores);
    } catch (error) {
      console.error('Error cargando proveedores:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = proveedores;

    if (searchTerm) {
      filtered = filtered.filter(proveedor =>
        proveedor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        proveedor.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(proveedor => proveedor.status === statusFilter);
    }

    setFilteredProveedores(filtered);
  }, [searchTerm, statusFilter, proveedores]);

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedProveedores,
    goToPage
  } = usePagination({ data: filteredProveedores || [], itemsPerPage: 10 });

  const openFilterModal = () => {
    setActiveFilters({
      status: statusFilter
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => setShowFilterModal(false);

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

  const openProveedorModal = useCallback((proveedor?: Proveedor) => {
    if (createButtonLoading) return;
    
    setCreateButtonLoading(true);
    try {
      if (proveedor) {
        setEditingProveedor(proveedor);
        setProveedorName(proveedor.name);
        setProveedorContact(proveedor.contact_person);
        setProveedorEmail(proveedor.email);
        setProveedorPhone(proveedor.phone);
        setProveedorAddress(proveedor.address);
        setProveedorPaymentTerms(proveedor.payment_terms);
      } else {
        setEditingProveedor(null);
        setProveedorName('');
        setProveedorContact('');
        setProveedorEmail('');
        setProveedorPhone('');
        setProveedorAddress('');
        setProveedorPaymentTerms('');
      }
      setShowProveedorModal(true);
    } finally {
      setTimeout(() => setCreateButtonLoading(false), 100);
    }
  }, [createButtonLoading]);

  const closeProveedorModal = useCallback(() => {
    setShowProveedorModal(false);
    setEditingProveedor(null);
    setProveedorName('');
    setProveedorContact('');
    setProveedorEmail('');
    setProveedorPhone('');
    setProveedorAddress('');
    setProveedorPaymentTerms('');
  }, []);

  const handleProveedorSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    if (!proveedorName.trim() || !proveedorContact.trim() || !proveedorEmail.trim()) {
      alert('Los campos nombre, contacto y email son requeridos');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const proveedorData: Proveedor = {
        id: editingProveedor?.id || Date.now().toString(),
        name: proveedorName,
        contact_person: proveedorContact,
        email: proveedorEmail,
        phone: proveedorPhone,
        address: proveedorAddress,
        payment_terms: proveedorPaymentTerms || '30 días',
        status: 'active',
        total_purchases: editingProveedor?.total_purchases || 0,
        pending_amount: editingProveedor?.pending_amount || 0,
        last_purchase: editingProveedor?.last_purchase || '',
        created_at: editingProveedor?.created_at || new Date().toISOString().split('T')[0]
      };

      if (editingProveedor) {
        const updatedProveedores = proveedores.map(proveedor =>
          proveedor.id === editingProveedor.id ? proveedorData : proveedor
        );
        setProveedores(updatedProveedores);
        setFilteredProveedores(updatedProveedores);
        alert('Proveedor actualizado exitosamente');
      } else {
        setProveedores([proveedorData, ...proveedores]);
        setFilteredProveedores([proveedorData, ...filteredProveedores]);
        alert('Proveedor creado exitosamente');
      }
      
      closeProveedorModal();
    } catch (error) {
      console.error('Error procesando proveedor:', error);
      alert('Error procesando el proveedor');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, proveedorName, proveedorContact, proveedorEmail, proveedorPhone, proveedorAddress, proveedorPaymentTerms, editingProveedor, proveedores, closeProveedorModal]);

  const handleDelete = (proveedor: Proveedor) => {
    if (confirm(`¿Estás seguro de que deseas eliminar a ${proveedor.name}?`)) {
      const updatedProveedores = proveedores.filter(p => p.id !== proveedor.id);
      setProveedores(updatedProveedores);
      setFilteredProveedores(updatedProveedores);
      alert('Proveedor eliminado exitosamente');
    }
  };

  useEffect(() => {
    loadProveedores();
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

  const totalProveedores = filteredProveedores.length;
  const totalActivos = filteredProveedores.filter(p => p.status === 'active').length;
  const totalCompras = filteredProveedores.reduce((sum, p) => sum + p.total_purchases, 0);
  const totalPendiente = filteredProveedores.reduce((sum, p) => sum + p.pending_amount, 0);

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
              placeholder="Buscar por nombre, contacto o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 px-6 pl-12 text-gray-900 border-gray-300 focus:border-pink-500 focus:ring-pink-500"
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
              <span className="ml-2 bg-pink-100 text-pink-600 text-xs px-2 py-1 rounded-full">
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
            onClick={() => openProveedorModal()}
            disabled={createButtonLoading}
            className="h-12 px-6 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createButtonLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Abriendo...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Proveedor
              </>
            )}
          </Button>
          <Button
            onClick={loadProveedores}
            className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Actualizar
          </Button>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-pink-100 rounded-lg">
                <Building2 className="h-6 w-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Proveedores</p>
                <p className="text-2xl font-bold text-gray-900">{totalProveedores}</p>
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
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Compras</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCompras)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendiente</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPendiente)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contenido principal */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            <p className="text-gray-900 mt-4 text-lg">Cargando proveedores...</p>
          </div>
        ) : filteredProveedores.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-pink-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Building2 className="w-12 h-12 text-pink-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || statusFilter !== 'all' ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {searchTerm || statusFilter !== 'all' 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Comienza agregando tu primer proveedor'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button
                onClick={() => openProveedorModal()}
                className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white px-8 py-3 text-lg shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Agregar Primer Proveedor
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
                      Proveedor
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Compras
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pendiente
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
                  {paginatedProveedores.map((proveedor) => (
                    <tr key={proveedor.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="p-2 bg-pink-100 rounded-lg mr-3">
                            <Building2 className="w-5 h-5 text-pink-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{proveedor.name}</div>
                            <div className="text-sm text-gray-500">{proveedor.payment_terms}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{proveedor.contact_person}</div>
                          <div className="text-sm text-gray-500">{proveedor.email}</div>
                          <div className="text-sm text-gray-500">{proveedor.phone}</div>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-lg font-bold text-blue-600">
                          {formatCurrency(proveedor.total_purchases)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`text-lg font-bold ${proveedor.pending_amount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {formatCurrency(proveedor.pending_amount)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proveedor.status)}`}>
                          {getStatusText(proveedor.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openProveedorModal(proveedor)}
                            className="text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(proveedor)}
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
            {paginatedProveedores.map((proveedor) => (
              <Card key={proveedor.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Building2 className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{proveedor.name}</CardTitle>
                        <p className="text-sm text-gray-500">{proveedor.contact_person}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(proveedor.status)}`}>
                      {getStatusText(proveedor.status)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-2" />
                      <span>{proveedor.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{proveedor.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{proveedor.address}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Total Compras</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(proveedor.total_purchases)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Pendiente</p>
                      <p className={`text-lg font-bold ${proveedor.pending_amount > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {formatCurrency(proveedor.pending_amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <CreditCard className="w-4 h-4 mr-2" />
                    <span>{proveedor.payment_terms}</span>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openProveedorModal(proveedor)}
                      className="flex-1 text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(proveedor)}
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
        {!isLoading && filteredProveedores.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredProveedores.length}
              itemsPerPage={10}
              onPageChange={goToPage}
              itemType="proveedores"
            />
          </div>
        )}

        {/* Modal de filtros */}
        {showFilterModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-rose-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Filter className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Filtros de Proveedores</h2>
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
                      Estado
                    </label>
                    <select
                      value={activeFilters.status}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value as 'all' | 'active' | 'inactive' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-pink-500 focus:ring-pink-500"
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
                      className="bg-pink-600 hover:bg-pink-700 text-white px-6"
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

        {/* Modal de proveedor */}
        {showProveedorModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeProveedorModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-rose-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <Building2 className="w-6 h-6 text-pink-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {editingProveedor ? 'Modifica los datos del proveedor' : 'Agrega un nuevo proveedor al sistema'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={closeProveedorModal}
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
                      <Building2 className="w-4 h-4 inline mr-2 text-pink-600" />
                      Nombre del Proveedor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={proveedorName}
                      onChange={(e) => setProveedorName(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-pink-500 focus:ring-pink-500"
                      placeholder="Nombre de la empresa"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <User className="w-4 h-4 inline mr-2 text-pink-600" />
                      Persona de Contacto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={proveedorContact}
                      onChange={(e) => setProveedorContact(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-pink-500 focus:ring-pink-500"
                      placeholder="Nombre del contacto"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-3">
                        <Mail className="w-4 h-4 inline mr-2 text-pink-600" />
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={proveedorEmail}
                        onChange={(e) => setProveedorEmail(e.target.value)}
                        className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-pink-500 focus:ring-pink-500"
                        placeholder="email@proveedor.com"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-3">
                        <Phone className="w-4 h-4 inline mr-2 text-pink-600" />
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={proveedorPhone}
                        onChange={(e) => setProveedorPhone(e.target.value)}
                        className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-pink-500 focus:ring-pink-500"
                        placeholder="+593 99 123 4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <MapPin className="w-4 h-4 inline mr-2 text-pink-600" />
                      Dirección
                    </label>
                    <input
                      type="text"
                      value={proveedorAddress}
                      onChange={(e) => setProveedorAddress(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-pink-500 focus:ring-pink-500"
                      placeholder="Dirección completa"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <CreditCard className="w-4 h-4 inline mr-2 text-pink-600" />
                      Términos de Pago
                    </label>
                    <select
                      value={proveedorPaymentTerms}
                      onChange={(e) => setProveedorPaymentTerms(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-pink-500 focus:ring-pink-500"
                    >
                      <option value="15 días">15 días</option>
                      <option value="30 días">30 días</option>
                      <option value="45 días">45 días</option>
                      <option value="60 días">60 días</option>
                      <option value="Contado">Contado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    onClick={closeProveedorModal}
                    variant="outline"
                    className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleProveedorSubmit}
                    disabled={isSubmitting || !proveedorName.trim() || !proveedorContact.trim() || !proveedorEmail.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Building2 className="w-4 h-4 mr-2" />
                        {editingProveedor ? 'Actualizar Proveedor' : 'Crear Proveedor'}
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

