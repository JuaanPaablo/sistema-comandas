'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { 
  History, 
  Search,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  Hash,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRightLeft
} from 'lucide-react';
import { 
  StockMovementService, 
  TransferService, 
  BatchService,
  InventoryItemService,
  InventoryService,
  HistoryLogService 
} from '@/lib/services/inventoryService';
import { 
  StockMovement, 
  Transfer, 
  Batch, 
  InventoryItem,
  Inventory 
} from '@/lib/types';

type HistoryItem = {
  id: string;
  type: 'movement' | 'transfer' | 'batch';
  date: string;
  description: string;
  product: string;
  quantity?: number;
  status?: string;
  reference?: string;
  notes?: string;
};

const statusIcons = {
  pending: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  in_transit: { icon: Truck, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100' },
  cancelled: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100' },
  entry: { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
  exit: { icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-100' },
  adjustment: { icon: Package, color: 'text-blue-600', bgColor: 'bg-blue-100' }
};

const typeConfig = {
  product: { icon: Package, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Producto' },
  batch: { icon: Hash, color: 'text-orange-600', bgColor: 'bg-orange-100', label: 'Lote' },
  transfer: { icon: ArrowRightLeft, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Transferencia' },
  movement: { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Movimiento' }
};

export default function HistoryModule() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Cargar datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [movementsRes, transfersRes, batchesRes, productsRes, inventoriesRes, historyLogRes] = await Promise.all([
        StockMovementService.getAllWithInactive(),
        TransferService.getAllWithInactive(),
        BatchService.getAllWithInactive(),
        InventoryItemService.getAll(),
        InventoryService.getAll(),
        HistoryLogService.getAll()
      ]);

      if (productsRes.data) setProducts(productsRes.data);
      if (inventoriesRes.data) setInventories(inventoriesRes.data);

      // Combinar todos los datos en un solo historial
      const combinedHistory: HistoryItem[] = [];

      // Agregar eventos del log histórico (datos inmutables)
      if (historyLogRes.data) {
        historyLogRes.data.forEach((logEntry: any) => {
          // Determinar el tipo correcto según el event_type
          let eventType = 'batch'; // Por defecto
          let status = 'completed';
          
          switch (logEntry.event_type) {
            case 'product_created':
              eventType = 'product';
              break;
            case 'batch_created':
              eventType = 'batch';
              break;
            case 'batch_created_transfer':
              eventType = 'transfer';
              break;
            case 'stock_adjusted':
              eventType = 'movement';
              break;
            default:
              eventType = 'batch';
          }
          
          combinedHistory.push({
            id: logEntry.id,
            type: eventType,
            date: logEntry.created_at,
            description: logEntry.description,
            product: logEntry.inventory_item_id,
            quantity: logEntry.quantity_after, // Cantidad histórica inmutable
            status: status,
            reference: logEntry.reference,
            notes: logEntry.notes
          });
        });
      }

      // NOTA: Los datos históricos ahora vienen principalmente del history_log
      // Los otros datos se mantienen solo para compatibilidad pero no se muestran
      // ya que el history_log contiene la información inmutable y precisa

      // Ordenar por fecha (más reciente primero)
      combinedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setHistoryItems(combinedHistory);
      setFilteredItems(combinedHistory);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtrar elementos del historial
  useEffect(() => {
    let filtered = historyItems;

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedProduct) {
      filtered = filtered.filter(item => item.product === selectedProduct);
    }

    if (selectedType) {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    if (dateRange.start && dateRange.end) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    setFilteredItems(filtered);
  }, [searchTerm, selectedProduct, selectedType, dateRange, historyItems]);

  // Obtener nombre del producto
  const getProductName = (id: string) => {
    const product = products.find(product => product.id === id);
    if (!product) return 'N/A';
    
    const inventory = inventories.find(inv => inv.id === product.inventory_id);
    const inventoryName = inventory ? inventory.name : 'N/A';
    
    return `${product.name} (${inventoryName})`;
  };

  // Obtener información del estado
  const getStatusInfo = (status: string) => {
    return statusIcons[status as keyof typeof statusIcons] || statusIcons.completed;
  };

  // Obtener configuración del tipo
  const getTypeConfig = (type: string) => {
    return typeConfig[type as keyof typeof typeConfig] || typeConfig.batch;
  };

  return (
    <div className="p-6">
      {/* Filtros */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search-history"
              type="text"
              placeholder="Buscar en el historial..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select
            id="filter-product"
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="min-w-[180px]"
          >
            <option value="">Todos los productos</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {getProductName(product.id)}
              </option>
            ))}
          </Select>
          
          <Select
            id="filter-type"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="min-w-[150px]"
          >
            <option value="">Todos los tipos</option>
            <option value="movement">Movimientos</option>
            <option value="transfer">Transferencias</option>
            <option value="batch">Lotes</option>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Inicio
            </label>
            <Input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Fin
            </label>
            <Input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Historial */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Historial de Actividades ({filteredItems.length})
        </h3>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Cargando historial...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <Card className="p-8 text-center">
            <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No hay actividades en el historial</h4>
            <p className="text-gray-600 mb-4">Las actividades aparecerán aquí una vez que comiences a usar el sistema</p>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Referencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                    Notas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  const typeConfig = getTypeConfig(item.type);
                  const TypeIcon = typeConfig.icon;
                  const statusInfo = item.status ? getStatusInfo(item.status) : null;
                  
                  return (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className={`h-8 w-8 rounded-lg ${typeConfig.bgColor} flex items-center justify-center`}>
                              <TypeIcon className={`h-5 w-5 ${typeConfig.color}`} />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {typeConfig.label}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getProductName(item.product)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {statusInfo ? (
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-6 w-6">
                              <div className={`h-6 w-6 rounded-full ${statusInfo.bgColor} flex items-center justify-center`}>
                                <statusInfo.icon className={`h-4 w-4 ${statusInfo.color}`} />
                              </div>
                            </div>
                            <div className="ml-2">
                              <div className="text-xs font-medium text-gray-900 capitalize">
                                {item.status === 'entry' ? 'Entrada' : 
                                 item.status === 'exit' ? 'Salida' : 
                                 item.status === 'adjustment' ? 'Ajuste' :
                                 item.status === 'pending' ? 'Pendiente' :
                                 item.status === 'in_transit' ? 'En Tránsito' :
                                 item.status === 'completed' ? 'Completado' :
                                 item.status === 'cancelled' ? 'Cancelado' : item.status}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.reference || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.notes || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resumen */}
      {filteredItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Movimientos</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {filteredItems.filter(item => item.type === 'movement').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Truck className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Transferencias</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {filteredItems.filter(item => item.type === 'transfer').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Hash className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Lotes</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {filteredItems.filter(item => item.type === 'batch').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {filteredItems.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
