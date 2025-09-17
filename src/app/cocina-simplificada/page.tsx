'use client';

import React, { useState, useEffect } from 'react';
import { ComandaService, ComandaComplete } from '@/lib/services/comandaService';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { supabase } from '@/lib/supabase';

export default function CocinaSimplificadaPage() {
  const [comandas, setComandas] = useState<ComandaComplete[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const { isConnected, lastUpdate } = useRealtimeUpdates();

  const loadComandas = async () => {
    try {
      setLoading(true);
      const { data, error } = await ComandaService.getActive();
      
      if (error) {
        console.error('Error loading comandas:', error);
        return;
      }
      
      setComandas(data || []);
    } catch (error) {
      console.error('Error loading comandas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComandas();
    
    // Configurar suscripción en tiempo real para comandas
    const subscription = supabase
      .channel('comandas_kitchen_realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comandas'
        }, 
        (payload) => {
          console.log('🔄 Cambio detectado en comandas (cocina):', payload);
          loadComandas();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comanda_items'
        }, 
        (payload) => {
          console.log('🔄 Cambio detectado en comanda_items (cocina):', payload);
          loadComandas();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Recargar cuando hay actualizaciones en tiempo real (backup polling)
  useEffect(() => {
    if (isConnected) {
      loadComandas();
    }
  }, [isConnected, lastUpdate]);

  const handleItemStatusChange = async (itemId: string, newStatus: 'ready' | 'served') => {
    try {
      const { error } = await ComandaService.updateItemStatus(itemId, newStatus);
      
      if (error) {
        console.error('Error updating item status:', error);
        return;
      }
      
      // Recargar comandas para reflejar el cambio
      await loadComandas();
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const handleBulkStatusChange = async (newStatus: 'ready' | 'served') => {
    try {
      const promises = Array.from(selectedItems).map(itemId => 
        ComandaService.updateItemStatus(itemId, newStatus)
      );
      
      await Promise.all(promises);
      
      // Limpiar selección
      setSelectedItems(new Set());
      
      // Recargar comandas
      await loadComandas();
    } catch (error) {
      console.error('Error updating bulk status:', error);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const selectAllItems = (comandaId: string) => {
    const comanda = comandas.find(c => c.id === comandaId);
    if (!comanda) return;
    
    const pendingItems = comanda.items.filter(item => item.status === 'pending');
    const newSelection = new Set(selectedItems);
    
    pendingItems.forEach(item => {
      newSelection.add(item.id);
    });
    
    setSelectedItems(newSelection);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-red-100 text-red-800 border-red-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'served': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '⏳ Pendiente';
      case 'ready': return '✅ Listo';
      case 'served': return '🍽️ Servido';
      default: return '❓ Desconocido';
    }
  };

  const pendingComandas = comandas.filter(c => c.status === 'pending');
  const readyComandas = comandas.filter(c => c.status === 'ready');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">🍳 COCINA SIMPLIFICADA</h1>
            <p className="text-gray-600">Gestión simplificada de comandas</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Última actualización: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{comandas.length}</div>
          <div className="text-sm text-gray-600">Total Comandas</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600">{pendingComandas.length}</div>
          <div className="text-sm text-red-600">Pendientes</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{readyComandas.length}</div>
          <div className="text-sm text-green-600">Listas para Servir</div>
        </div>
      </div>

      {/* Acciones en lote */}
      {selectedItems.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-800">
              {selectedItems.size} items seleccionados
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBulkStatusChange('ready')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                ✅ Marcar como Listo ({selectedItems.size})
              </button>
              <button
                onClick={() => setSelectedItems(new Set())}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                ❌ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Pendientes */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              ⏳ Pendientes ({pendingComandas.length})
            </h2>
          </div>
          <div className="p-4">
            {pendingComandas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay comandas pendientes
              </div>
            ) : (
              <div className="space-y-4">
                {pendingComandas.map((comanda) => (
                  <div key={comanda.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Comanda #{comanda.id.slice(-6)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Mesa: {comanda.table_number} | Mesero: {comanda.employee_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(comanda.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <button
                        onClick={() => selectAllItems(comanda.id)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                      >
                        Seleccionar Todos
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {comanda.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={selectedItems.has(item.id)}
                              onChange={() => toggleItemSelection(item.id)}
                              className="rounded"
                            />
                            <span className="text-sm font-medium">
                              {item.dish_name} x{item.quantity}
                            </span>
                            {item.notes && (
                              <span className="text-xs text-gray-500">
                                ({item.notes})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                              {getStatusText(item.status)}
                            </span>
                            <button
                              onClick={() => handleItemStatusChange(item.id, 'ready')}
                              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                            >
                              ✅ Listo
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna Listas para Servir */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              ✅ Listas para Servir ({readyComandas.length})
            </h2>
          </div>
          <div className="p-4">
            {readyComandas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay comandas listas para servir
              </div>
            ) : (
              <div className="space-y-4">
                {readyComandas.map((comanda) => (
                  <div key={comanda.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          Comanda #{comanda.id.slice(-6)}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Mesa: {comanda.table_number} | Mesero: {comanda.employee_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(comanda.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {comanda.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {item.dish_name} x{item.quantity}
                            </span>
                            {item.notes && (
                              <span className="text-xs text-gray-500">
                                ({item.notes})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                              {getStatusText(item.status)}
                            </span>
                            <button
                              onClick={() => handleItemStatusChange(item.id, 'served')}
                              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                            >
                              🍽️ Servido
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}