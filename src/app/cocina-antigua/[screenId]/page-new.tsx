'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KitchenScreenService, KitchenScreen, ScreenOrder } from '@/lib/services/kitchenScreenService';

export default function PantallaCocinaPage() {
  const params = useParams();
  const router = useRouter();
  const screenId = params.screenId as string;
  
  const [screen, setScreen] = useState<KitchenScreen | null>(null);
  const [orders, setOrders] = useState<ScreenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (screenId) {
      loadScreenData();
      // Auto-refresh every 10 seconds
      const interval = setInterval(loadScreenData, 10000);
      return () => clearInterval(interval);
    }
  }, [screenId]);

  const loadScreenData = async () => {
    try {
      setLoading(true);
      setError(null);
      
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
      setLoading(false);
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    try {
      await KitchenScreenService.updateOrderItemStatus(itemId, newStatus);
      await loadScreenData(); // Reload data
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
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <p className="mt-6 text-xl text-gray-600">Cargando pantalla de cocina...</p>
        </div>
      </div>
    );
  }

  if (error || !screen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-8xl mb-6">⚠️</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-xl text-gray-600 mb-8">{error || 'Pantalla no encontrada'}</p>
          <button
            onClick={() => router.push('/cocina')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg"
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
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={loadScreenData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-lg"
              >
                🔄 Actualizar
              </button>
            </div>
          </div>
        </div>

        {/* Status Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white transform scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
              }`}
            >
              📋 Todas ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all ${
                statusFilter === 'pending'
                  ? 'bg-red-600 text-white transform scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-red-50 hover:border-red-300'
              }`}
            >
              🔴 Sin Preparar ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('preparing')}
              className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all ${
                statusFilter === 'preparing'
                  ? 'bg-yellow-500 text-white transform scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-yellow-50 hover:border-yellow-300'
              }`}
            >
              🟡 En Preparación ({orders.filter(o => o.status === 'preparing').length})
            </button>
            <button
              onClick={() => setStatusFilter('ready')}
              className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all ${
                statusFilter === 'ready'
                  ? 'bg-green-600 text-white transform scale-105'
                  : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-green-50 hover:border-green-300'
              }`}
            >
              🟢 Listo ({orders.filter(o => o.status === 'ready').length})
            </button>
          </div>
        </div>

        {/* Orders */}
        {Object.keys(groupedOrders).length === 0 ? (
          <div className="text-center py-20">
            <div className="mx-auto h-32 w-32 text-gray-300 mb-6">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay órdenes</h3>
            <p className="text-lg text-gray-500 mb-6">
              {statusFilter === 'all' 
                ? 'No hay órdenes para esta pantalla'
                : `No hay órdenes con estado "${getStatusText(statusFilter)}"`
              }
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-blue-800">
                💡 <strong>Tip:</strong> Las órdenes aparecerán aquí cuando los meseros las creen desde la app móvil.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {Object.values(groupedOrders).map((order: any) => (
              <div key={order.order_id} className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 hover:shadow-2xl transition-all duration-300">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Orden #{order.order_number}
                      </h3>
                      <p className="text-lg text-gray-600 mt-1">
                        🍽️ Mesa: {order.table_number || 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Hora</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {new Date(order.items[0].created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {order.items.map((item: ScreenOrder) => (
                      <div key={item.item_id} className={`p-4 rounded-xl border-2 transition-all ${
                        item.status === 'pending' ? 'bg-red-50 border-red-200' :
                        item.status === 'preparing' ? 'bg-yellow-50 border-yellow-200' :
                        item.status === 'ready' ? 'bg-green-50 border-green-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <span className="text-lg font-bold text-gray-900">
                                {item.dish_name}
                              </span>
                              <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm font-bold">
                                x{item.quantity}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                item.status === 'pending' ? 'bg-red-100 text-red-800' :
                                item.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                                item.status === 'ready' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {item.status === 'pending' ? '🔴 Sin Preparar' :
                                 item.status === 'preparing' ? '🟡 En Preparación' :
                                 item.status === 'ready' ? '🟢 Listo' : '🔵 Entregado'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {item.status !== 'delivered' && (
                              <button
                                onClick={() => handleStatusChange(item.item_id, getNextStatus(item.status))}
                                className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg transition-all hover:scale-105 ${
                                  item.status === 'pending'
                                    ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                    : item.status === 'preparing'
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                              >
                                {item.status === 'pending' ? '▶️ Iniciar' : 
                                 item.status === 'preparing' ? '✅ Listo' : '📤 Entregar'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
