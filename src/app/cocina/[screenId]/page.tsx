'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { KitchenScreenService, KitchenScreen } from '@/lib/services/kitchenScreenService';
import { ComandaService, ComandaComplete } from '@/lib/services/comandaService';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PantallaIndividualPage() {
  const params = useParams();
  const router = useRouter();
  const screenId = params.screenId as string;
  
  const [screen, setScreen] = useState<KitchenScreen | null>(null);
  const [comandas, setComandas] = useState<ComandaComplete[]>([]);
  const [filteredComandas, setFilteredComandas] = useState<ComandaComplete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (screenId) {
      loadScreenData();
    }
  }, [screenId]);

  const loadScreenData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [screenData, comandasResult] = await Promise.all([
        KitchenScreenService.getScreenById(screenId),
        ComandaService.getActive()
      ]);
      
      if (!screenData) {
        setError('Pantalla no encontrada');
        return;
      }
      
      if (comandasResult.error) {
        console.error('Error loading comandas:', comandasResult.error);
        setError('Error al cargar las comandas');
        return;
      }
      
      setScreen(screenData);
      setComandas(comandasResult.data || []);
      
      // Filtrar comandas según los platillos asignados a esta pantalla
      filterComandasByScreen(comandasResult.data || [], screenData);
      
    } catch (err) {
      setError('Error al cargar los datos de la pantalla');
      console.error('Error loading screen data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterComandasByScreen = (allComandas: ComandaComplete[], screenData: KitchenScreen) => {
    // Obtener IDs de platillos asignados a esta pantalla
    const screenDishIds = new Set(screenData.assigned_dishes?.map(d => d.dish_id) || []);
    
    // Filtrar comandas que tengan al menos un item de los platillos de esta pantalla
    const filtered = allComandas.map(comanda => ({
      ...comanda,
      items: comanda.items.filter(item => screenDishIds.has(item.dish_id))
    })).filter(comanda => comanda.items.length > 0);
    
    setFilteredComandas(filtered);
  };

  useEffect(() => {
    // Configurar suscripción en tiempo real
    const subscription = supabase
      .channel(`screen_${screenId}_realtime`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comandas'
        }, 
        (payload) => {
          console.log('🔄 Cambio detectado en comandas (pantalla):', payload);
          loadScreenData();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comanda_items'
        }, 
        (payload) => {
          console.log('🔄 Cambio detectado en comanda_items (pantalla):', payload);
          loadScreenData();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [screenId]);

  const handleItemStatusChange = async (itemId: string, newStatus: 'ready' | 'served') => {
    try {
      const { error } = await ComandaService.updateItemStatus(itemId, newStatus);
      
      if (error) {
        console.error('Error updating item status:', error);
        return;
      }
      
      // Recargar datos
      await loadScreenData();
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
      
      // Recargar datos
      await loadScreenData();
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

  const pendingComandas = filteredComandas.filter(c => c.items.some(item => item.status === 'pending'));
  const readyComandas = filteredComandas.filter(c => c.items.some(item => item.status === 'ready') && !c.items.some(item => item.status === 'pending'));

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ {error}</div>
          <Link
            href="/cocina"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Volver a Cocina
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/cocina"
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🖥️ {screen?.name}</h1>
              <p className="text-gray-600">{screen?.description || 'Estación de trabajo especializada'}</p>
              <p className="text-sm text-gray-500">
                Platillos asignados: {screen?.assigned_dishes?.length || 0}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Última actualización: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm text-gray-600">Conectado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-gray-900">{filteredComandas.length}</div>
          <div className="text-sm text-gray-600">Comandas Filtradas</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">
            {filteredComandas.reduce((acc, c) => acc + c.items.length, 0)}
          </div>
          <div className="text-sm text-blue-600">Items Totales</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600">{pendingComandas.length}</div>
          <div className="text-sm text-red-600">Pendientes</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{readyComandas.length}</div>
          <div className="text-sm text-green-600">Listas</div>
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

      {filteredComandas.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            No hay comandas para esta estación en este momento
          </div>
          <p className="text-gray-400 mt-2">
            Los platillos aparecerán aquí cuando se asignen a esta pantalla
          </p>
        </div>
      ) : (
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
                  No hay items pendientes para esta estación
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingComandas.map((comanda) => (
                    <div key={comanda.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3">
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
                      
                      <div className="space-y-2">
                        {comanda.items.filter(item => item.status === 'pending').map((item) => (
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

          {/* Columna Listas */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                ✅ Listas para Servir ({readyComandas.length})
              </h2>
            </div>
            <div className="p-4">
              {readyComandas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay items listos para esta estación
                </div>
              ) : (
                <div className="space-y-4">
                  {readyComandas.map((comanda) => (
                    <div key={comanda.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3">
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
                      
                      <div className="space-y-2">
                        {comanda.items.filter(item => item.status === 'ready').map((item) => (
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
      )}
    </div>
  );
}
