'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KitchenScreenService, KitchenScreen, ScreenOrder } from '@/lib/services/kitchenScreenService';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Componente para mostrar una orden
const OrderCard = ({ order, showOnlyStatus }: { order: any, showOnlyStatus: string }) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Sin Preparar';
      case 'preparing':
        return 'En Preparación';
      case 'ready':
        return 'Listo';
      case 'delivered':
        return 'Entregado';
      default:
        return status;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'delivered';
      default:
        return currentStatus;
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      console.log('🔄 Cambiando estado del item:', itemId, 'a:', newStatus);
      await KitchenScreenService.updateOrderItemStatus(itemId, newStatus);
      console.log('✅ Estado actualizado');
      
      // Forzar actualización inmediata después del cambio
      setTimeout(() => {
        if (window.location.pathname.includes('/cocina/')) {
          window.location.reload();
        }
      }, 500);
    } catch (err) {
      console.error('Error updating item status:', err);
    }
  };

  const handleBulkStatusChange = async (orderId: string, newStatus: string) => {
    try {
      console.log('🔄 Cambiando estado de toda la orden:', orderId, 'a:', newStatus);
      
      // Obtener todos los items de la orden
      const { data: items, error: fetchError } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', orderId);

      if (fetchError) {
        console.error('Error obteniendo items de la orden:', fetchError);
        return;
      }

      // Actualizar todos los items
      const updatePromises = items.map(item => 
        KitchenScreenService.updateOrderItemStatus(item.id, newStatus)
      );

      await Promise.all(updatePromises);
      console.log('✅ Estado de toda la orden actualizado');
      
      // Recargar después de un breve delay
      setTimeout(() => {
        if (window.location.pathname.includes('/cocina/')) {
          window.location.reload();
        }
      }, 500);
    } catch (err) {
      console.error('Error updating bulk status:', err);
    }
  };

  // Funciones para manejar selección múltiple
  const toggleItemSelection = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const selectAllItems = () => {
    const allItemIds = filteredItems.map((item: ScreenOrder) => item.item_id);
    setSelectedItems(new Set(allItemIds));
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
  };

  const handleSelectedItemsStatusChange = async (newStatus: string) => {
    if (selectedItems.size === 0) return;

    try {
      console.log('🔄 Cambiando estado de items seleccionados:', Array.from(selectedItems), 'a:', newStatus);
      
      const updatePromises = Array.from(selectedItems).map(itemId => 
        KitchenScreenService.updateOrderItemStatus(itemId, newStatus)
      );

      await Promise.all(updatePromises);
      console.log('✅ Estado de items seleccionados actualizado');
      
      // Limpiar selección
      setSelectedItems(new Set());
      
      // Recargar después de un breve delay
      setTimeout(() => {
        if (window.location.pathname.includes('/cocina/')) {
          window.location.reload();
        }
      }, 500);
    } catch (err) {
      console.error('Error updating selected items status:', err);
    }
  };

  // Filtrar items por estado si se especifica
  const filteredItems = showOnlyStatus 
    ? order.items.filter((item: ScreenOrder) => item.status === showOnlyStatus)
    : order.items;

  // Determinar qué botones mostrar según el estado de los items
  const getAvailableActions = () => {
    const statuses = filteredItems.map((item: ScreenOrder) => item.status);
    const uniqueStatuses = [...new Set(statuses)];
    
    const actions = [];
    
    if (uniqueStatuses.includes('pending')) {
      actions.push({ status: 'preparing', label: 'Iniciar', color: 'bg-yellow-600 hover:bg-yellow-700' });
    }
    
    if (uniqueStatuses.includes('preparing')) {
      actions.push({ status: 'ready', label: 'Listo', color: 'bg-green-600 hover:bg-green-700' });
    }
    
    if (uniqueStatuses.includes('ready')) {
      actions.push({ status: 'delivered', label: 'Entregar', color: 'bg-blue-600 hover:bg-blue-700' });
    }
    
    return actions;
  };

  const availableActions = getAvailableActions();

  if (filteredItems.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">
            Orden #{order.order_number}
          </h4>
          <p className="text-xs text-gray-600">
            Mesa: {order.table_number || 'N/A'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">
            {new Date(order.items[0].created_at).toLocaleTimeString()}
          </p>
        </div>
      </div>
      
      {/* Controles de selección */}
      {filteredItems.length > 0 && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                onChange={selectedItems.size === filteredItems.length ? clearSelection : selectAllItems}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {selectedItems.size === 0 ? 'Seleccionar todos' : 
                 selectedItems.size === filteredItems.length ? 'Deseleccionar todos' : 
                 `${selectedItems.size} de ${filteredItems.length} seleccionados`}
              </span>
            </div>
            
            {selectedItems.size > 0 && (
              <button
                onClick={clearSelection}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Botón único para items seleccionados */}
          {selectedItems.size > 0 && availableActions.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {availableActions.map((action) => (
                <button
                  key={`selected-${action.status}`}
                  onClick={() => handleSelectedItemsStatusChange(action.status)}
                  className={`px-6 py-3 text-white text-base font-semibold rounded-xl ${action.color} shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105`}
                >
                  {action.label} ({selectedItems.size})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {filteredItems.map((item: ScreenOrder) => (
          <div key={item.item_id} className={`flex items-center justify-between p-2 rounded-lg ${
            selectedItems.has(item.item_id) ? 'bg-blue-100 border-2 border-blue-300' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-3 flex-1">
              <input
                type="checkbox"
                checked={selectedItems.has(item.item_id)}
                onChange={() => toggleItemSelection(item.item_id)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {item.dish_name}
                  </span>
                  <span className="text-sm text-gray-500">
                    x{item.quantity}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                    {getStatusText(item.status)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {item.status !== 'delivered' && (
                <button
                  onClick={() => {
                    const nextStatus = getNextStatus(item.status);
                    console.log('🖱️ Botón clickeado - Item:', item.item_id, 'Estado actual:', item.status, 'Siguiente:', nextStatus);
                    handleStatusChange(item.item_id, nextStatus);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 ${
                    item.status === 'pending'
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : item.status === 'preparing'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {item.status === 'pending' ? 'Iniciar' : 
                   item.status === 'preparing' ? 'Listo' : 'Entregar'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function PantallaCocinaPage() {
  const params = useParams();
  const router = useRouter();
  const screenId = params.screenId as string;
  
  const [screen, setScreen] = useState<KitchenScreen | null>(null);
  const [orders, setOrders] = useState<ScreenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);

  // Hook para actualizaciones en tiempo real
  const { isConnected, lastUpdate: realtimeLastUpdate, forceUpdate, reconnect } = useRealtimeUpdates({
    interval: 1000, // Actualizar cada 1 segundo para mayor responsividad
    enabled: !!screenId,
    screenId: screenId,
    onUpdate: async () => {
      console.log('🔄 Actualización automática en tiempo real');
      setIsUpdating(true);
      try {
        await loadScreenData(false);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Error en actualización automática:', error);
      } finally {
        setIsUpdating(false);
      }
    }
  });

  useEffect(() => {
    if (screenId) {
      loadScreenData(true);
    }
  }, [screenId]);

  const loadScreenData = async (showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      console.log('Loading screen data for ID:', screenId);
      
      const [screenData, ordersData] = await Promise.all([
        KitchenScreenService.getScreenById(screenId),
        KitchenScreenService.getScreenOrders(screenId)
      ]);
      
      console.log('Screen data:', screenData);
      console.log('Orders data:', ordersData);
      
      if (!screenData) {
        setError('Pantalla no encontrada');
        return;
      }
      
      setScreen(screenData);
      setOrders(Array.isArray(ordersData) ? ordersData : []);
    } catch (err) {
      setError('Error al cargar los datos de la pantalla');
      console.error('Error loading screen data:', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      console.log('🔄 Cambiando estado del item:', itemId, 'a:', newStatus);
      await KitchenScreenService.updateOrderItemStatus(itemId, newStatus);
      console.log('✅ Estado actualizado, recargando datos...');
      await loadScreenData(); // Reload data
      console.log('✅ Datos recargados');
    } catch (err) {
      setError('Error al actualizar el estado del item');
      console.error('Error updating item status:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Sin Preparar';
      case 'preparing':
        return 'En Preparación';
      case 'ready':
        return 'Listo';
      case 'delivered':
        return 'Entregado';
      default:
        return status;
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'delivered';
      default:
        return currentStatus;
    }
  };

  const filteredOrders = orders.filter(order => 
    statusFilter === 'all' || order.status === statusFilter
  );

  const groupedOrders = filteredOrders.reduce((acc, order) => {
    if (!acc[order.order_id]) {
      acc[order.order_id] = {
        order_id: order.order_id,
        order_number: order.order_number,
        table_number: order.table_number,
        customer_name: order.customer_name,
        items: []
      };
    }
    acc[order.order_id].items.push(order);
    return acc;
  }, {} as Record<string, any>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando pantalla...</p>
        </div>
      </div>
    );
  }

  if (error || !screen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Pantalla no encontrada'}</p>
          <button
            onClick={() => router.push('/cocina')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            Volver a Pantallas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/cocina')}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">🍳 {screen.name}</h1>
                <p className="mt-2 text-gray-600">Pantalla de cocina en tiempo real</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Última actualización</p>
                <p className="text-lg font-semibold text-gray-900">
                  {lastUpdate.toLocaleTimeString()}
                </p>
                <p className={`text-xs font-medium ${isUpdating ? 'text-yellow-600' : isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isUpdating ? '🟡 Actualizando...' : isConnected ? '🟢 Tiempo Real' : '🔴 Desconectado'}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    forceUpdate();
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium text-lg"
                >
                  🔄 Actualizar
                </button>
                {!isConnected && (
                  <button
                    onClick={() => {
                      reconnect();
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium text-lg"
                  >
                    🔌 Reconectar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Summary - Vista Unificada */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
                  <p className="text-3xl font-bold text-gray-900">{orders.length}</p>
                </div>
                <div className="text-4xl">📋</div>
              </div>
            </div>
            
            <div className="bg-red-50 rounded-xl p-6 shadow-lg border-2 border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Sin Preparar</p>
                  <p className="text-3xl font-bold text-red-700">{orders.filter(o => o.status === 'pending').length}</p>
                </div>
                <div className="text-4xl">🔴</div>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-xl p-6 shadow-lg border-2 border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">En Preparación</p>
                  <p className="text-3xl font-bold text-yellow-700">{orders.filter(o => o.status === 'preparing').length}</p>
                </div>
                <div className="text-4xl">🟡</div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-xl p-6 shadow-lg border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Listo</p>
                  <p className="text-3xl font-bold text-green-700">{orders.filter(o => o.status === 'ready').length}</p>
                </div>
                <div className="text-4xl">🟢</div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders - Vista por Columnas */}
        {Object.keys(groupedOrders).length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No hay órdenes</h3>
            <p className="mt-2 text-gray-500">No hay órdenes para esta pantalla</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna: Sin Preparar */}
            <div className="space-y-4">
              <div className="bg-red-100 rounded-lg p-4 border-2 border-red-300">
                <h3 className="text-lg font-bold text-red-800 flex items-center">
                  🔴 Sin Preparar ({orders.filter(o => o.status === 'pending').length})
                </h3>
              </div>
              <div className="space-y-3">
                {Object.values(groupedOrders)
                  .filter((order: any) => order.items.some((item: ScreenOrder) => item.status === 'pending'))
                  .map((order: any) => (
                    <OrderCard key={order.order_id} order={order} showOnlyStatus="pending" />
                  ))}
              </div>
            </div>

            {/* Columna: En Preparación */}
            <div className="space-y-4">
              <div className="bg-yellow-100 rounded-lg p-4 border-2 border-yellow-300">
                <h3 className="text-lg font-bold text-yellow-800 flex items-center">
                  🟡 En Preparación ({orders.filter(o => o.status === 'preparing').length})
                </h3>
              </div>
              <div className="space-y-3">
                {Object.values(groupedOrders)
                  .filter((order: any) => order.items.some((item: ScreenOrder) => item.status === 'preparing'))
                  .map((order: any) => (
                    <OrderCard key={order.order_id} order={order} showOnlyStatus="preparing" />
                  ))}
              </div>
            </div>

            {/* Columna: Listo */}
            <div className="space-y-4">
              <div className="bg-green-100 rounded-lg p-4 border-2 border-green-300">
                <h3 className="text-lg font-bold text-green-800 flex items-center">
                  🟢 Listo ({orders.filter(o => o.status === 'ready').length})
                </h3>
              </div>
              <div className="space-y-3">
                {Object.values(groupedOrders)
                  .filter((order: any) => order.items.some((item: ScreenOrder) => item.status === 'ready'))
                  .map((order: any) => (
                    <OrderCard key={order.order_id} order={order} showOnlyStatus="ready" />
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
