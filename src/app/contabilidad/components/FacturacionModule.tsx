'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { 
  FileText, 
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
  Download,
  Send,
  CheckCircle
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

interface Factura {
  id: string;
  type: 'factura' | 'nota_credito' | 'nota_debito';
  number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  created_at: string;
  due_date?: string;
  paid_at?: string;
  employee_name: string;
  items: FacturaItem[];
}

interface FacturaItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function FacturacionModule() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [filteredFacturas, setFilteredFacturas] = useState<Factura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'factura' | 'nota_credito' | 'nota_debito'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'sent' | 'paid' | 'cancelled'>('all');
  
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    type: 'all' as 'all' | 'factura' | 'nota_credito' | 'nota_debito',
    status: 'all' as 'all' | 'draft' | 'sent' | 'paid' | 'cancelled'
  });

  const [showFacturaModal, setShowFacturaModal] = useState(false);
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null);
  const [facturaType, setFacturaType] = useState<'factura' | 'nota_credito' | 'nota_debito'>('factura');
  const [facturaCustomerName, setFacturaCustomerName] = useState('');
  const [facturaCustomerEmail, setFacturaCustomerEmail] = useState('');
  const [facturaCustomerPhone, setFacturaCustomerPhone] = useState('');
  const [facturaAmount, setFacturaAmount] = useState('');
  const [facturaTaxAmount, setFacturaTaxAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);

  const loadFacturas = async () => {
    try {
      setIsLoading(true);
      const mockFacturas: Factura[] = [
        {
          id: '1',
          type: 'factura',
          number: 'FAC-001',
          customer_name: 'Juan Pérez',
          customer_email: 'juan@email.com',
          customer_phone: '0991234567',
          amount: 25.50,
          tax_amount: 3.06,
          total_amount: 28.56,
          status: 'paid',
          created_at: '2024-01-15T10:30:00Z',
          due_date: '2024-01-22T10:30:00Z',
          paid_at: '2024-01-15T11:00:00Z',
          employee_name: 'María García',
          items: [
            {
              id: '1',
              description: 'Hamburguesa Clásica',
              quantity: 1,
              unit_price: 12.50,
              total: 12.50
            },
            {
              id: '2',
              description: 'Papas Fritas',
              quantity: 1,
              unit_price: 3.00,
              total: 3.00
            },
            {
              id: '3',
              description: 'Refresco',
              quantity: 1,
              unit_price: 2.50,
              total: 2.50
            }
          ]
        },
        {
          id: '2',
          type: 'factura',
          number: 'FAC-002',
          customer_name: 'Carlos López',
          customer_email: 'carlos@email.com',
          amount: 45.00,
          tax_amount: 5.40,
          total_amount: 50.40,
          status: 'sent',
          created_at: '2024-01-15T11:45:00Z',
          due_date: '2024-01-22T11:45:00Z',
          employee_name: 'Juan Pérez',
          items: [
            {
              id: '4',
              description: 'Pizza Margherita',
              quantity: 1,
              unit_price: 18.00,
              total: 18.00
            },
            {
              id: '5',
              description: 'Ensalada César',
              quantity: 1,
              unit_price: 8.00,
              total: 8.00
            }
          ]
        },
        {
          id: '3',
          type: 'nota_credito',
          number: 'NC-001',
          customer_name: 'Ana Martínez',
          amount: 15.00,
          tax_amount: 1.80,
          total_amount: 16.80,
          status: 'draft',
          created_at: '2024-01-15T14:20:00Z',
          employee_name: 'Carlos López',
          items: [
            {
              id: '6',
              description: 'Devolución - Bebida',
              quantity: 1,
              unit_price: -3.00,
              total: -3.00
            }
          ]
        }
      ];
      
      setFacturas(mockFacturas);
      setFilteredFacturas(mockFacturas);
    } catch (error) {
      console.error('Error cargando facturas:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = facturas;

    if (searchTerm) {
      filtered = filtered.filter(factura =>
        factura.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        factura.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (factura.customer_email && factura.customer_email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(factura => factura.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(factura => factura.status === statusFilter);
    }

    setFilteredFacturas(filtered);
  }, [searchTerm, typeFilter, statusFilter, facturas]);

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedFacturas,
    goToPage
  } = usePagination({ data: filteredFacturas || [], itemsPerPage: 10 });

  const openFilterModal = () => {
    setActiveFilters({
      type: typeFilter,
      status: statusFilter
    });
    setShowFilterModal(true);
  };

  const closeFilterModal = () => setShowFilterModal(false);

  const applyFilters = () => {
    setTypeFilter(activeFilters.type);
    setStatusFilter(activeFilters.status);
    setShowFilterModal(false);
  };

  const clearFilters = () => {
    setActiveFilters({ type: 'all', status: 'all' });
    setTypeFilter('all');
    setStatusFilter('all');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.type !== 'all') count++;
    if (activeFilters.status !== 'all') count++;
    return count;
  };

  const openFacturaModal = useCallback((factura?: Factura) => {
    if (createButtonLoading) return;
    
    setCreateButtonLoading(true);
    try {
      if (factura) {
        setEditingFactura(factura);
        setFacturaType(factura.type);
        setFacturaCustomerName(factura.customer_name);
        setFacturaCustomerEmail(factura.customer_email || '');
        setFacturaCustomerPhone(factura.customer_phone || '');
        setFacturaAmount(factura.amount.toString());
        setFacturaTaxAmount(factura.tax_amount.toString());
      } else {
        setEditingFactura(null);
        setFacturaType('factura');
        setFacturaCustomerName('');
        setFacturaCustomerEmail('');
        setFacturaCustomerPhone('');
        setFacturaAmount('');
        setFacturaTaxAmount('');
      }
      setShowFacturaModal(true);
    } finally {
      setTimeout(() => setCreateButtonLoading(false), 100);
    }
  }, [createButtonLoading]);

  const closeFacturaModal = useCallback(() => {
    setShowFacturaModal(false);
    setEditingFactura(null);
    setFacturaCustomerName('');
    setFacturaCustomerEmail('');
    setFacturaCustomerPhone('');
    setFacturaAmount('');
    setFacturaTaxAmount('');
  }, []);

  const handleFacturaSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    if (!facturaCustomerName.trim() || !facturaAmount.trim()) {
      alert('El nombre del cliente y el monto son requeridos');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const facturaData: Factura = {
        id: editingFactura?.id || Date.now().toString(),
        type: facturaType,
        number: editingFactura?.number || `FAC-${Date.now().toString().slice(-3)}`,
        customer_name: facturaCustomerName,
        customer_email: facturaCustomerEmail || undefined,
        customer_phone: facturaCustomerPhone || undefined,
        amount: parseFloat(facturaAmount),
        tax_amount: parseFloat(facturaTaxAmount || '0'),
        total_amount: parseFloat(facturaAmount) + parseFloat(facturaTaxAmount || '0'),
        status: 'draft',
        created_at: editingFactura?.created_at || new Date().toISOString(),
        due_date: editingFactura?.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        employee_name: 'Usuario Actual',
        items: editingFactura?.items || []
      };

      if (editingFactura) {
        const updatedFacturas = facturas.map(factura =>
          factura.id === editingFactura.id ? facturaData : factura
        );
        setFacturas(updatedFacturas);
        setFilteredFacturas(updatedFacturas);
        alert('Factura actualizada exitosamente');
      } else {
        setFacturas([facturaData, ...facturas]);
        setFilteredFacturas([facturaData, ...filteredFacturas]);
        alert('Factura creada exitosamente');
      }
      
      closeFacturaModal();
    } catch (error) {
      console.error('Error procesando factura:', error);
      alert('Error procesando la factura');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, facturaCustomerName, facturaAmount, facturaType, facturaCustomerEmail, facturaCustomerPhone, facturaTaxAmount, editingFactura, facturas, closeFacturaModal]);

  useEffect(() => {
    loadFacturas();
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
      case 'factura': return 'bg-blue-100 text-blue-800';
      case 'nota_credito': return 'bg-green-100 text-green-800';
      case 'nota_debito': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'factura': return 'Factura';
      case 'nota_credito': return 'Nota de Crédito';
      case 'nota_debito': return 'Nota de Débito';
      default: return 'Desconocido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'sent': return 'Enviada';
      case 'paid': return 'Pagada';
      case 'cancelled': return 'Cancelada';
      default: return 'Desconocido';
    }
  };

  const totalFacturas = filteredFacturas.reduce((sum, factura) => sum + factura.total_amount, 0);
  const totalPagadas = filteredFacturas.filter(f => f.status === 'paid').reduce((sum, factura) => sum + factura.total_amount, 0);
  const totalPendientes = filteredFacturas.filter(f => f.status === 'sent').reduce((sum, factura) => sum + factura.total_amount, 0);

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
        {/* Encabezado contextual (Contabilidad) */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Facturación</h1>
          <p className="text-gray-600">Administración fiscal de comprobantes: series, estados y notas de crédito/débito</p>
          <div className="mt-2">
            <Button
              onClick={() => (window.location.href = '/caja')}
              variant="outline"
              className="h-9 px-3 text-indigo-700 border-indigo-300 hover:bg-indigo-50"
              title="Ir a Caja (Operaciones)"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Ir a Caja (Operaciones)
            </Button>
          </div>
        </div>
        {/* Toolbar unificado */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Buscar por cliente, número o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 px-6 pl-12 text-gray-900 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
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
              <span className="ml-2 bg-purple-100 text-purple-600 text-xs px-2 py-1 rounded-full">
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
            onClick={() => openFacturaModal()}
            disabled={createButtonLoading}
            className="h-12 px-6 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createButtonLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Abriendo...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Nueva Factura
              </>
            )}
          </Button>
          <Button
            onClick={loadFacturas}
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
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Facturas</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalFacturas)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pagadas</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPagadas)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPendientes)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contenido principal */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="text-gray-900 mt-4 text-lg">Cargando facturas...</p>
          </div>
        ) : filteredFacturas.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-purple-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <FileText className="w-12 h-12 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? 'No se encontraron facturas' : 'No hay facturas registradas'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Comienza creando tu primera factura'
              }
            </p>
            {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
              <Button
                onClick={() => openFacturaModal()}
                className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white px-8 py-3 text-lg shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear Primera Factura
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
                      Número
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
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
                  {paginatedFacturas.map((factura) => (
                    <tr key={factura.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{factura.number}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(factura.type)}`}>
                          {getTypeText(factura.type)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{factura.customer_name}</div>
                        {factura.customer_email && (
                          <div className="text-xs text-gray-500">{factura.customer_email}</div>
                        )}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(factura.status)}`}>
                          {getStatusText(factura.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-lg font-bold text-purple-600">
                          {formatCurrency(factura.total_amount)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDateTime(factura.created_at)}
                        </div>
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
                            className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:text-green-700 border-green-300 hover:border-green-400"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openFacturaModal(factura)}
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
            {paginatedFacturas.map((factura) => (
              <Card key={factura.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{factura.number}</CardTitle>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(factura.type)}`}>
                      {getTypeText(factura.type)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>{factura.customer_name}</span>
                  </div>
                  
                  {factura.customer_email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Receipt className="w-4 h-4 mr-2" />
                      <span>{factura.customer_email}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm text-gray-600">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(factura.status)}`}>
                      {getStatusText(factura.status)}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{formatDateTime(factura.created_at)}</span>
                  </div>

                  <div className="text-center">
                    <span className="text-2xl font-bold text-purple-600">
                      {formatCurrency(factura.total_amount)}
                    </span>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openFacturaModal(factura)}
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
        {!isLoading && filteredFacturas.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredFacturas.length}
              itemsPerPage={10}
              onPageChange={goToPage}
              itemType="facturas"
            />
          </div>
        )}

        {/* Modal de filtros */}
        {showFilterModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Filter className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Filtros de Facturación</h2>
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
                      Tipo de Documento
                    </label>
                    <select
                      value={activeFilters.type}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, type: e.target.value as 'all' | 'factura' | 'nota_credito' | 'nota_debito' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="all">Todos los tipos</option>
                      <option value="factura">📄 Facturas</option>
                      <option value="nota_credito">📋 Notas de Crédito</option>
                      <option value="nota_debito">📝 Notas de Débito</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={activeFilters.status}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value as 'all' | 'draft' | 'sent' | 'paid' | 'cancelled' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="draft">📝 Borrador</option>
                      <option value="sent">📤 Enviada</option>
                      <option value="paid">✅ Pagada</option>
                      <option value="cancelled">❌ Cancelada</option>
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
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6"
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

        {/* Modal de factura */}
        {showFacturaModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFacturaModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-violet-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {editingFactura ? 'Editar Factura' : 'Nueva Factura'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {editingFactura ? 'Modifica los datos de la factura' : 'Crea una nueva factura'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={closeFacturaModal}
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
                      <FileText className="w-4 h-4 inline mr-2 text-purple-600" />
                      Tipo de Documento <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={facturaType}
                      onChange={(e) => setFacturaType(e.target.value as 'factura' | 'nota_credito' | 'nota_debito')}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                    >
                      <option value="factura">📄 Factura</option>
                      <option value="nota_credito">📋 Nota de Crédito</option>
                      <option value="nota_debito">📝 Nota de Débito</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <User className="w-4 h-4 inline mr-2 text-purple-600" />
                      Nombre del Cliente <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={facturaCustomerName}
                      onChange={(e) => setFacturaCustomerName(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="Nombre completo del cliente"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Receipt className="w-4 h-4 inline mr-2 text-purple-600" />
                      Email del Cliente (opcional)
                    </label>
                    <input
                      type="email"
                      value={facturaCustomerEmail}
                      onChange={(e) => setFacturaCustomerEmail(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="cliente@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Smartphone className="w-4 h-4 inline mr-2 text-purple-600" />
                      Teléfono del Cliente (opcional)
                    </label>
                    <input
                      type="tel"
                      value={facturaCustomerPhone}
                      onChange={(e) => setFacturaCustomerPhone(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="0991234567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <DollarSign className="w-4 h-4 inline mr-2 text-purple-600" />
                      Monto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={facturaAmount}
                      onChange={(e) => setFacturaAmount(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <Receipt className="w-4 h-4 inline mr-2 text-purple-600" />
                      Impuestos (opcional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={facturaTaxAmount}
                      onChange={(e) => setFacturaTaxAmount(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-purple-500 focus:ring-purple-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    onClick={closeFacturaModal}
                    variant="outline"
                    className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleFacturaSubmit}
                    disabled={isSubmitting || !facturaCustomerName.trim() || !facturaAmount.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        {editingFactura ? 'Actualizar Factura' : 'Crear Factura'}
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
