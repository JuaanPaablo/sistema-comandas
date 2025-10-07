'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { 
  Receipt, 
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
  Printer,
  Download,
  Eye,
  RefreshCw,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';

interface Ticket {
  id: string;
  type: 'venta' | 'cobro' | 'devolucion' | 'corte_caja';
  number: string;
  amount: number;
  customer_name?: string;
  employee_name: string;
  created_at: string;
  printed_at?: string;
  status: 'pending' | 'printed' | 'cancelled';
  items: TicketItem[];
}

interface TicketItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function TicketsModule() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'venta' | 'cobro' | 'devolucion' | 'corte_caja'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'printed' | 'cancelled'>('all');
  
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    type: 'all' as 'all' | 'venta' | 'cobro' | 'devolucion' | 'corte_caja',
    status: 'all' as 'all' | 'pending' | 'printed' | 'cancelled'
  });

  const [showTicketModal, setShowTicketModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [ticketType, setTicketType] = useState<'venta' | 'cobro' | 'devolucion' | 'corte_caja'>('venta');
  const [ticketAmount, setTicketAmount] = useState('');
  const [ticketCustomerName, setTicketCustomerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createButtonLoading, setCreateButtonLoading] = useState(false);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const mockTickets: Ticket[] = [
        {
          id: '1',
          type: 'venta',
          number: 'TKT-001',
          amount: 25.50,
          customer_name: 'Juan Pérez',
          employee_name: 'María García',
          created_at: '2024-01-15T10:30:00Z',
          printed_at: '2024-01-15T10:31:00Z',
          status: 'printed',
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
            }
          ]
        },
        {
          id: '2',
          type: 'cobro',
          number: 'COB-001',
          amount: 45.00,
          customer_name: 'Carlos López',
          employee_name: 'Juan Pérez',
          created_at: '2024-01-15T11:45:00Z',
          status: 'pending',
          items: [
            {
              id: '3',
              description: 'Pago de cuenta',
              quantity: 1,
              unit_price: 45.00,
              total: 45.00
            }
          ]
        },
        {
          id: '3',
          type: 'devolucion',
          number: 'DEV-001',
          amount: 15.00,
          customer_name: 'Ana Martínez',
          employee_name: 'Carlos López',
          created_at: '2024-01-15T14:20:00Z',
          printed_at: '2024-01-15T14:21:00Z',
          status: 'printed',
          items: [
            {
              id: '4',
              description: 'Devolución - Bebida',
              quantity: 1,
              unit_price: -3.00,
              total: -3.00
            }
          ]
        },
        {
          id: '4',
          type: 'corte_caja',
          number: 'CORTE-001',
          amount: 1250.50,
          employee_name: 'María García',
          created_at: '2024-01-15T18:00:00Z',
          printed_at: '2024-01-15T18:01:00Z',
          status: 'printed',
          items: []
        }
      ];
      
      setTickets(mockTickets);
      setFilteredTickets(mockTickets);
    } catch (error) {
      console.error('Error cargando tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let filtered = tickets;

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ticket.customer_name && ticket.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    setFilteredTickets(filtered);
  }, [searchTerm, typeFilter, statusFilter, tickets]);

  const {
    currentPage,
    totalPages,
    paginatedData: paginatedTickets,
    goToPage
  } = usePagination({ data: filteredTickets || [], itemsPerPage: 10 });

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

  const openTicketModal = useCallback((ticket?: Ticket) => {
    if (createButtonLoading) return;
    
    setCreateButtonLoading(true);
    try {
      if (ticket) {
        setEditingTicket(ticket);
        setTicketType(ticket.type);
        setTicketAmount(ticket.amount.toString());
        setTicketCustomerName(ticket.customer_name || '');
      } else {
        setEditingTicket(null);
        setTicketType('venta');
        setTicketAmount('');
        setTicketCustomerName('');
      }
      setShowTicketModal(true);
    } finally {
      setTimeout(() => setCreateButtonLoading(false), 100);
    }
  }, [createButtonLoading]);

  const closeTicketModal = useCallback(() => {
    setShowTicketModal(false);
    setEditingTicket(null);
    setTicketAmount('');
    setTicketCustomerName('');
  }, []);

  const handleTicketSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    if (!ticketAmount.trim()) {
      alert('El monto es requerido');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const ticketData: Ticket = {
        id: editingTicket?.id || Date.now().toString(),
        type: ticketType,
        number: editingTicket?.number || `TKT-${Date.now().toString().slice(-3)}`,
        amount: parseFloat(ticketAmount),
        customer_name: ticketCustomerName || undefined,
        employee_name: 'Usuario Actual',
        created_at: editingTicket?.created_at || new Date().toISOString(),
        status: 'pending',
        items: editingTicket?.items || []
      };

      if (editingTicket) {
        const updatedTickets = tickets.map(ticket =>
          ticket.id === editingTicket.id ? ticketData : ticket
        );
        setTickets(updatedTickets);
        setFilteredTickets(updatedTickets);
        alert('Ticket actualizado exitosamente');
      } else {
        setTickets([ticketData, ...tickets]);
        setFilteredTickets([ticketData, ...filteredTickets]);
        alert('Ticket creado exitosamente');
      }
      
      closeTicketModal();
    } catch (error) {
      console.error('Error procesando ticket:', error);
      alert('Error procesando el ticket');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, ticketAmount, ticketType, ticketCustomerName, editingTicket, tickets, closeTicketModal]);

  const handlePrint = (ticket: Ticket) => {
    // Simular impresión
    alert(`Imprimiendo ticket ${ticket.number}...`);
    // En producción, aquí se enviaría a la impresora
  };

  const handleDownload = (ticket: Ticket) => {
    // Simular descarga
    alert(`Descargando ticket ${ticket.number}...`);
    // En producción, aquí se generaría el PDF
  };

  useEffect(() => {
    loadTickets();
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
      case 'cobro': return 'bg-blue-100 text-blue-800';
      case 'devolucion': return 'bg-red-100 text-red-800';
      case 'corte_caja': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'venta': return 'Venta';
      case 'cobro': return 'Cobro';
      case 'devolucion': return 'Devolución';
      case 'corte_caja': return 'Corte de Caja';
      default: return 'Desconocido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'printed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'printed': return 'Impreso';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconocido';
    }
  };

  const totalTickets = filteredTickets.length;
  const totalImpresos = filteredTickets.filter(t => t.status === 'printed').length;
  const totalPendientes = filteredTickets.filter(t => t.status === 'pending').length;

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
              placeholder="Buscar por número, empleado o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 px-6 pl-12 text-gray-900 border-gray-300 focus:border-teal-500 focus:ring-teal-500"
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
              <span className="ml-2 bg-teal-100 text-teal-600 text-xs px-2 py-1 rounded-full">
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
            onClick={() => openTicketModal()}
            disabled={createButtonLoading}
            className="h-12 px-6 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createButtonLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Abriendo...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Nuevo Ticket
              </>
            )}
          </Button>
          <Button
            onClick={loadTickets}
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
              <div className="p-2 bg-teal-100 rounded-lg">
                <Receipt className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Impresos</p>
                <p className="text-2xl font-bold text-gray-900">{totalImpresos}</p>
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
                <p className="text-2xl font-bold text-gray-900">{totalPendientes}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contenido principal */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-gray-900 mt-4 text-lg">Cargando tickets...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16">
            <div className="p-6 bg-teal-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <Receipt className="w-12 h-12 text-teal-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' ? 'No se encontraron tickets' : 'No hay tickets registrados'}
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              {searchTerm || typeFilter !== 'all' || statusFilter !== 'all' 
                ? 'Intenta con otros filtros de búsqueda'
                : 'Comienza creando tu primer ticket'
              }
            </p>
            {!searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
              <Button
                onClick={() => openTicketModal()}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-8 py-3 text-lg shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear Primer Ticket
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
                      Empleado
                    </th>
                    <th className="px-8 py-6 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
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
                  {paginatedTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ticket.number}</div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(ticket.type)}`}>
                          {getTypeText(ticket.type)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        {ticket.customer_name || '-'}
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{ticket.employee_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                          {getStatusText(ticket.status)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap">
                        <span className="text-lg font-bold text-teal-600">
                          {formatCurrency(ticket.amount)}
                        </span>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatDateTime(ticket.created_at)}
                        </div>
                      </td>
                      <td className="px-8 py-6 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrint(ticket)}
                            className="text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(ticket)}
                            className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
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
                            onClick={() => openTicketModal(ticket)}
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
            {paginatedTickets.map((ticket) => (
              <Card key={ticket.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-teal-100 rounded-lg">
                        <Receipt className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-gray-900">{ticket.number}</CardTitle>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(ticket.type)}`}>
                      {getTypeText(ticket.type)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {ticket.customer_name && (
                    <div className="flex items-center text-sm text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span>{ticket.customer_name}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>{ticket.employee_name}</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                      {getStatusText(ticket.status)}
                    </span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{formatDateTime(ticket.created_at)}</span>
                  </div>

                  <div className="text-center">
                    <span className="text-2xl font-bold text-teal-600">
                      {formatCurrency(ticket.amount)}
                    </span>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(ticket)}
                      className="flex-1 text-gray-600 hover:text-gray-700 border-gray-300 hover:border-gray-400"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimir
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(ticket)}
                      className="text-blue-600 hover:text-blue-700 border-blue-300 hover:border-blue-400"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openTicketModal(ticket)}
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
        {!isLoading && filteredTickets.length > 0 && (
          <div className="mt-8">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTickets.length}
              itemsPerPage={10}
              onPageChange={goToPage}
              itemType="tickets"
            />
          </div>
        )}

        {/* Modal de filtros */}
        {showFilterModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeFilterModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Filter className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Filtros de Tickets</h2>
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
                      Tipo de Ticket
                    </label>
                    <select
                      value={activeFilters.type}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, type: e.target.value as 'all' | 'venta' | 'cobro' | 'devolucion' | 'corte_caja' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                    >
                      <option value="all">Todos los tipos</option>
                      <option value="venta">🛒 Venta</option>
                      <option value="cobro">💰 Cobro</option>
                      <option value="devolucion">↩️ Devolución</option>
                      <option value="corte_caja">✂️ Corte de Caja</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={activeFilters.status}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value as 'all' | 'pending' | 'printed' | 'cancelled' }))}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="pending">⏳ Pendiente</option>
                      <option value="printed">✅ Impreso</option>
                      <option value="cancelled">❌ Cancelado</option>
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
                      className="bg-teal-600 hover:bg-teal-700 text-white px-6"
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

        {/* Modal de ticket */}
        {showTicketModal && createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeTicketModal}></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-cyan-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-teal-100 rounded-lg">
                      <Receipt className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {editingTicket ? 'Editar Ticket' : 'Nuevo Ticket'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {editingTicket ? 'Modifica los datos del ticket' : 'Crea un nuevo ticket'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={closeTicketModal}
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
                      <Receipt className="w-4 h-4 inline mr-2 text-teal-600" />
                      Tipo de Ticket <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={ticketType}
                      onChange={(e) => setTicketType(e.target.value as 'venta' | 'cobro' | 'devolucion' | 'corte_caja')}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                    >
                      <option value="venta">🛒 Venta</option>
                      <option value="cobro">💰 Cobro</option>
                      <option value="devolucion">↩️ Devolución</option>
                      <option value="corte_caja">✂️ Corte de Caja</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <User className="w-4 h-4 inline mr-2 text-teal-600" />
                      Cliente (opcional)
                    </label>
                    <input
                      type="text"
                      value={ticketCustomerName}
                      onChange={(e) => setTicketCustomerName(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                      placeholder="Nombre del cliente"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      <DollarSign className="w-4 h-4 inline mr-2 text-teal-600" />
                      Monto <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={ticketAmount}
                      onChange={(e) => setTicketAmount(e.target.value)}
                      className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-teal-500 focus:ring-teal-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    onClick={closeTicketModal}
                    variant="outline"
                    className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleTicketSubmit}
                    disabled={isSubmitting || !ticketAmount.trim()}
                    className="px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Receipt className="w-4 h-4 mr-2" />
                        {editingTicket ? 'Actualizar Ticket' : 'Crear Ticket'}
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
