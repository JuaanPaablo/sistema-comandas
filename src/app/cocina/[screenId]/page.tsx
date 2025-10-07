'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { KitchenScreenService, KitchenScreen } from '@/lib/services/kitchenScreenService';
import { ComandaService, ComandaComplete } from '@/lib/services/comandaService';
import { supabase } from '@/lib/supabase';
import { KDSHeader } from '@/components/kds/KDSHeader';
import { StatusTabs } from '@/components/kds/StatusTabs';
import { OrderCard } from '@/components/kds/OrderCard';
import { EmptyState } from '@/components/kds/EmptyState';
import { Timer, AlertTriangle } from 'lucide-react';

export default function PantallaIndividualPage() {
  const params = useParams();
  const screenId = params.screenId as string;
  
  const [screen, setScreen] = useState<KitchenScreen | null>(null);
  const [comandas, setComandas] = useState<ComandaComplete[]>([]);
  const [filteredComandas, setFilteredComandas] = useState<ComandaComplete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'ready' | 'served'>('all');

  useEffect(() => {
    if (screenId) {
      loadScreenData();
    }
  }, [screenId]);

  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    if (screen) {
      filterComandasByScreen(comandas, screen);
    }
  }, [statusFilter, screen, comandas]);

  const loadScreenData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const screenData = await KitchenScreenService.getScreenById(screenId);
      
      if (!screenData) {
        setError('Pantalla no encontrada');
        return;
      }
      
      setScreen(screenData);
      
      // Obtener comandas directamente con sus items individuales
      await loadComandasWithItems(screenData);
      
    } catch (err) {
      setError('Error al cargar los datos de la pantalla');
      console.error('Error loading screen data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadComandasWithItems = async (screenData: KitchenScreen) => {
    try {
      
    // Obtener IDs de platillos asignados a esta pantalla
      const screenDishIds = new Set((screenData as any).assigned_dishes?.map((d: any) => d.dish_id) || []);
      
      if (screenDishIds.size === 0) {
        console.log('⚠️ No hay platillos asignados a esta pantalla');
        setComandas([]);
        setFilteredComandas([]);
        return;
      }

      // Obtener comandas activas con sus items individuales
      const { data: comandas, error: comandasError } = await supabase
        .from('comandas')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            position
          ),
          orders:order_id (
            id,
            service_type
          )
        `)
        .in('status', ['pending', 'ready'])
        .order('created_at', { ascending: false });

      if (comandasError) {
        console.error('❌ Error loading comandas:', comandasError);
        setError(`Error al cargar las comandas: ${comandasError.message || 'Error desconocido'}`);
        return;
      }


      // Obtener items de comanda para las comandas activas
      const comandaIds = comandas?.map(c => c.id) || [];
      
      if (comandaIds.length === 0) {
        setComandas([]);
        setFilteredComandas([]);
        return;
      }

      const { data: comandaItems, error: itemsError } = await supabase
        .from('comanda_items')
        .select(`
          *,
          dishes:dish_id (
            name
          ),
          order_items:order_item_id (
            notes,
            variant_id,
            menu_item_name,
            dish_name,
            variant:variants!order_items_variant_id_fkey (
              name,
              price_adjustment,
              selection_text
            )
          )
        `)
        .in('comanda_id', comandaIds)
        .in('dish_id', Array.from(screenDishIds));

      if (itemsError) {
        console.error('❌ Error loading comanda items:', itemsError);
        setError(`Error al cargar los items de comanda: ${itemsError.message || 'Error desconocido'}`);
        return;
      }


      // Resolver variantes faltantes por variant_id y por order_item_id
      const orderItemIds = Array.from(new Set((comandaItems || []).map((ci: any) => ci.order_item_id)));

      let orderItemIdToVariant: Record<string, { name: string; price_adjustment: number; selection_text?: string; notes_data?: any[] }> = {};
      if (orderItemIds.length > 0) {
        const { data: orderItemsRows, error: oiError } = await supabase
          .from('order_items')
          .select('id, variant_id, notes, variant:variants!order_items_variant_id_fkey ( name, price_adjustment, selection_text )')
          .in('id', orderItemIds as string[]);
        if (oiError) console.warn('⚠️ Error resolviendo order_items → variants:', oiError);
        if (orderItemsRows) {
          orderItemIdToVariant = orderItemsRows.reduce((acc: any, row: any) => {
            const v = row?.variant;
            
            // Si hay variant_id y variant, usar esos datos
            if (v) {
              acc[row.id] = { 
                name: v.name, 
                price_adjustment: v.price_adjustment,
                selection_text: v.selection_text
              };
            } else if (row.notes) {
              // Si no hay variant_id pero hay notes, intentar parsear el JSON
              try {
                const parsedNotes = JSON.parse(row.notes);
                if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
                  // Usar la primera variante del array
                  const firstVariant = parsedNotes[0];
                  acc[row.id] = {
                    name: firstVariant.name,
                    price_adjustment: firstVariant.price_adjustment || 0,
                    selection_text: firstVariant.selection_text,
                    notes_data: parsedNotes // Guardar todo el array para uso posterior
                  };
                }
              } catch (e) {
                console.warn('Error parsing notes as JSON:', e);
              }
            }
            return acc;
          }, {} as Record<string, { name: string; price_adjustment: number; selection_text?: string; notes_data?: any[] }>);
        }
      }

      // Si no encontramos variantes por variant_id, buscar directamente por dish_id
      if (Object.keys(orderItemIdToVariant).length === 0) {
        
        // Obtener dish_ids únicos de los comanda_items
        const dishIds = Array.from(new Set((comandaItems || []).map((ci: any) => ci.dish_id)));
        
        if (dishIds.length > 0) {
          const { data: variantsByDish, error: variantsByDishError } = await supabase
            .from('variants')
            .select('id, name, dish_id, selection_text, price_adjustment')
            .in('dish_id', dishIds as string[])
            .eq('active', true);
          
          if (variantsByDishError) {
            console.warn('⚠️ Error obteniendo variantes por dish_id:', variantsByDishError);
          } else if (variantsByDish && variantsByDish.length > 0) {
            
            // Crear un mapa de dish_id -> variants
            const dishIdToVariants = variantsByDish.reduce((acc: any, variant: any) => {
              if (!acc[variant.dish_id]) {
                acc[variant.dish_id] = [];
              }
              acc[variant.dish_id].push(variant);
              return acc;
            }, {} as Record<string, any[]>);
            
            // Asignar variantes a order_items basándose en el dish_name
            (comandaItems || []).forEach((ci: any) => {
              const variants = dishIdToVariants[ci.dish_id];
              if (variants && variants.length > 0) {
                // Buscar variante que coincida con el dish_name o usar la primera
                let matchingVariant = variants.find((v: any) => 
                  ci.dish_name.includes(v.name) || v.name.includes(ci.dish_name.split(' ')[0])
                );
                
                if (!matchingVariant && variants.length > 0) {
                  matchingVariant = variants[0]; // Usar la primera si no hay coincidencia exacta
                }
                
                if (matchingVariant) {
                  orderItemIdToVariant[ci.order_item_id] = {
                    name: matchingVariant.name,
                    price_adjustment: matchingVariant.price_adjustment,
                    selection_text: matchingVariant.selection_text
                  };
                }
              }
            });
            
          }
        }
      }

      const missingVariantIds = Array.from(
        new Set(
          (comandaItems || [])
            .map((ci: any) => ci?.order_items?.variant_id)
            .filter((id: string | null | undefined) => !!id)
        )
      );

      let variantIdToVariant: Record<string, { id: string; name: string; price_adjustment: number }> = {};

      if (missingVariantIds.length > 0) {
        const { data: variantsData, error: variantsError } = await supabase
          .from('variants')
          .select('id,name,price_adjustment,selection_text')
          .in('id', missingVariantIds as string[]);
        if (variantsError) console.warn('⚠️ Error resolviendo variants por id:', variantsError);
        if (variantsData) {
          variantIdToVariant = variantsData.reduce((acc: any, v: any) => {
            acc[v.id] = v;
            return acc;
          }, {} as Record<string, { id: string; name: string; price_adjustment: number }>);
        }
      }

      // Obtener información de mesas para las órdenes
      const orderIds = comandas?.map(c => c.order_id) || [];
      let tableInfoMap: Record<string, any> = {};
      
      if (orderIds.length > 0) {
        const { data: tablesData } = await supabase
          .from('tables')
          .select('id, number, capacity, status, current_order_id')
          .in('current_order_id', orderIds);
        
        if (tablesData) {
          tableInfoMap = tablesData.reduce((acc, table) => {
            if (table.current_order_id) {
              acc[table.current_order_id] = {
                id: table.id,
                number: table.number,
                capacity: table.capacity,
                status: table.status
              };
            }
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Combinar comandas con sus items individuales
      const comandasWithItems = comandas?.map(comanda => {
        const items = comandaItems?.filter(item => item.comanda_id === comanda.id) || [];
        return {
      ...comanda,
          employee_name: (comanda as any).employees?.name || 'Sin asignar',
          service_type: (comanda as any).orders?.service_type || 'local',
          table_info: tableInfoMap[comanda.order_id] || null,
          items: items.map(item => {
            const orderItem = (item as any).order_items;
            const variantFromJoin = orderItem?.variant;
            const variantFromOrderItemFetch = orderItemIdToVariant[item.order_item_id as string];
            const baseDishName = (item as any).dishes?.name || item.dish_name;

            // Resolver variante desde join, luego por fetch por order_item_id, luego por variant_id
            let selectedVariants: Array<{ name: string; price_adjustment: number }> = [];
            let selectionLabel: string | undefined;
            if (variantFromJoin) {
              selectedVariants = [{ name: variantFromJoin.name, price_adjustment: variantFromJoin.price_adjustment }];
              selectionLabel = variantFromJoin.selection_text as string | undefined;
            } else if (variantFromOrderItemFetch) {
              selectedVariants = [{ name: (variantFromOrderItemFetch as any).name, price_adjustment: (variantFromOrderItemFetch as any).price_adjustment }];
              selectionLabel = (variantFromOrderItemFetch as any).selection_text as string | undefined;
            } else if (orderItem?.variant_id && variantIdToVariant[orderItem.variant_id]) {
              const v = variantIdToVariant[orderItem.variant_id] as any;
              selectedVariants = [{ name: v.name, price_adjustment: v.price_adjustment }];
              selectionLabel = v.selection_text as string | undefined;
            }

            // Fallbacks cuando no hay variant_id
            let derivedVariantByName: string | undefined;
            const oiMenuName = orderItem?.menu_item_name as string | undefined;
            const oiDishName = orderItem?.dish_name as string | undefined;
            if (!selectedVariants.length) {
              if (oiMenuName && oiMenuName !== baseDishName) {
                derivedVariantByName = oiMenuName;
              } else if (oiDishName && oiDishName !== baseDishName) {
                derivedVariantByName = oiDishName;
              } else if (item.dish_name && item.dish_name !== baseDishName) {
                derivedVariantByName = item.dish_name;
              }
            }

            const variant_note = selectedVariants.length > 0
              ? selectedVariants.map(v => v.name).join(', ')
              : derivedVariantByName;


            // Buscar también en comanda_items notes y kitchen_notes
            const comandaItemNotes = item.notes;
            const comandaItemKitchenNotes = item.kitchen_notes;

            // Parsear selection_text si es un JSON array (desde variants o notes)
            let parsedSelectionText: string | undefined;
            const variantSelectionText = variantFromOrderItemFetch?.selection_text || variantFromJoin?.selection_text;
            const notesData = variantFromOrderItemFetch?.notes_data;
            
            try {
              // Primero intentar desde notes_data si existe
              if (notesData && Array.isArray(notesData) && notesData.length > 0) {
                const matchingVariant = notesData.find((v: any) => 
                  selectedVariants.some(sv => sv.name === v.name)
                );
                if (matchingVariant && matchingVariant.selection_text) {
                  parsedSelectionText = matchingVariant.selection_text;
                } else if (notesData[0] && notesData[0].selection_text) {
                  // Si no encuentra coincidencia, usar la primera
                  parsedSelectionText = notesData[0].selection_text;
                }
              } else if (comandaItemNotes) {
                // Buscar en comanda_items notes
                try {
                  const parsedNotes = JSON.parse(comandaItemNotes);
                  if (Array.isArray(parsedNotes) && parsedNotes.length > 0) {
                    const firstVariant = parsedNotes[0];
                    if (firstVariant && firstVariant.selection_text) {
                      parsedSelectionText = firstVariant.selection_text;
                    }
                  }
                } catch (e) {
                  console.warn('Error parsing comanda_item notes:', e);
                }
              } else if (comandaItemKitchenNotes) {
                // Buscar en comanda_items kitchen_notes
                try {
                  const parsedKitchenNotes = JSON.parse(comandaItemKitchenNotes);
                  if (Array.isArray(parsedKitchenNotes) && parsedKitchenNotes.length > 0) {
                    const firstVariant = parsedKitchenNotes[0];
                    if (firstVariant && firstVariant.selection_text) {
                      parsedSelectionText = firstVariant.selection_text;
                    }
                  }
                } catch (e) {
                  console.warn('Error parsing comanda_item kitchen_notes:', e);
                }
              } else if (typeof variantSelectionText === 'string' && variantSelectionText.startsWith('[')) {
                const parsed = JSON.parse(variantSelectionText);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  // Buscar la variante que coincida con el nombre actual
                  const matchingVariant = parsed.find((v: any) => 
                    selectedVariants.some(sv => sv.name === v.name)
                  );
                  if (matchingVariant && matchingVariant.selection_text) {
                    parsedSelectionText = matchingVariant.selection_text;
                  }
                }
              } else if (selectionLabel && selectionLabel !== 'Escoja una variante') {
                parsedSelectionText = selectionLabel;
              }
            } catch (e) {
              console.warn('Error parsing selection_text:', e);
            }

            // Usar selection_text parseado o el name de la variante
            let variant_label: string | undefined;
            if (parsedSelectionText) {
              variant_label = parsedSelectionText;
            } else if (selectedVariants.length > 0) {
              // Si no hay selection_text personalizado, usar el name de la variante como etiqueta
              variant_label = selectedVariants[0].name;
            } else if (variant_note) {
              variant_label = 'Variante';
            }


            
            return {
              ...item,
              base_dish_name: baseDishName,
              selected_variants: selectedVariants,
              variant_note,
              variant_label,
              notes: orderItem?.notes || item.notes
            };
          })
        };
      }).filter(comanda => comanda.items.length > 0) || [];

      setComandas(comandasWithItems);
      
      // Aplicar filtros adicionales
      filterComandasByScreen(comandasWithItems, screenData);
      
    } catch (err) {
      console.error('❌ Error loading comandas with items:', err);
      setError(`Error al cargar las comandas: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const filterComandasByScreen = (allComandas: ComandaComplete[], screenData: KitchenScreen) => {
    // Los datos ya vienen filtrados por pantalla desde loadComandasWithItems
    let filtered = [...allComandas];
    
    // Aplicar filtros de estado
    if (statusFilter === 'all') {
      // En "Todos los Pedidos" solo mostrar pendientes y listos (excluir entregados)
      filtered = filtered.map(c => ({
        ...c,
        items: c.items.filter(i => i.status === 'pending' || i.status === 'ready')
      })).filter(c => c.items.length > 0);
    } else {
      // Para filtros específicos, mostrar solo ese estado
      filtered = filtered.map(c => ({
        ...c,
        items: c.items.filter(i => i.status === statusFilter)
      })).filter(c => c.items.length > 0);
    }

    setFilteredComandas(filtered as any);
  };

  const applyRealtimeItemInsert = useCallback(async (row: any) => {
    // Recargar datos completos cuando se inserta un nuevo item
    if (screen) {
      await loadComandasWithItems(screen);
    }
  }, [screen]);

  const applyRealtimeItemUpdate = useCallback(async (row: any) => {
    // Recargar datos completos cuando se actualiza un item
    if (screen) {
      await loadComandasWithItems(screen);
    }
  }, [screen]);

  const applyRealtimeItemDelete = useCallback(async (row: any) => {
    // Recargar datos completos cuando se elimina un item
    if (screen) {
      await loadComandasWithItems(screen);
    }
  }, [screen]);

  useEffect(() => {
    // Realtime puro, con handlers incrementales según evento
    if (!screen || !(screen as any).assigned_dishes || (screen as any).assigned_dishes.length === 0) return;

    const channel = supabase
      .channel(`screen_${screenId}_kds`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comanda_items' }, (payload) => {
        applyRealtimeItemInsert(payload.new);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'comanda_items' }, (payload) => {
        applyRealtimeItemUpdate(payload.new);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'comanda_items' }, (payload) => {
        applyRealtimeItemDelete(payload.old);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [screenId, screen, applyRealtimeItemInsert, applyRealtimeItemUpdate, applyRealtimeItemDelete]);

  const handleItemStatusChange = async (itemId: string, newStatus: 'ready' | 'served') => {
    try {
      const result = await ComandaService.updateItemStatus(itemId, newStatus);
      
      if (result.success) {
        // Reproducir sonido si está habilitado
        if (soundEnabled) {
          playStatusSound(newStatus);
        }
        
        // Actualizar estado local
        setFilteredComandas(prev => prev.map(comanda => ({
          ...comanda,
          items: comanda.items.map(item => 
            item.id === itemId ? { ...item, status: newStatus } : item
          )
        })));
      } else {
        console.error('Error updating item status:', result.error);
      }
    } catch (error) {
      console.error('Error updating item status:', error);
    }
  };

  const playStatusSound = (status: 'ready' | 'served') => {
    try {
      // Crear un contexto de audio simple
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Frecuencia diferente según el estado
      oscillator.frequency.setValueAtTime(status === 'ready' ? 800 : 400, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (err) {
      console.log('Audio not available');
    }
  };


  const handleMarkAllReady = async (comandaId: string) => {
    const comanda = filteredComandas.find(c => c.id === comandaId);
    if (!comanda) return;

    const pendingItems = comanda.items.filter(item => item.status === 'pending');
    
    for (const item of pendingItems) {
      await handleItemStatusChange(item.id, 'ready');
    }
  };

  const handleMarkOrderServed = async (comandaId: string) => {
    const comanda = filteredComandas.find(c => c.id === comandaId);
    if (!comanda) return;

    const readyItems = comanda.items.filter(item => item.status === 'ready');
    
    for (const item of readyItems) {
      await handleItemStatusChange(item.id, 'served');
    }

    // Mostrar mensaje de confirmación
    console.log(`Pedido ${comandaId.slice(-6)} marcado como entregado y movido a la pestaña "Entregados"`);

    // Pequeño delay para que el usuario vea el cambio de estado
    setTimeout(() => {
      // Cambiar automáticamente a la pestaña "Entregados" después de marcar como servido
      setStatusFilter('served');
    }, 500);
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      // Eliminar el item de la comanda
      const { error } = await supabase
        .from('comanda_items')
        .delete()
        .eq('id', itemId);

      if (error) {
        console.error('Error deleting item:', error);
        return;
      }

      // Recargar datos
      if (screen) {
        await loadComandasWithItems(screen);
      }
      
      console.log('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Calcular estadísticas para las pestañas (usando datos originales antes del filtrado)
  const allComandas = comandas; // Datos originales sin filtrar
  
  const pendingComandas = allComandas.filter(comanda => 
    comanda.items.some(item => item.status === 'pending')
  );

  const readyComandas = allComandas.filter(comanda => 
    comanda.items.some(item => item.status === 'ready')
  );

  const servedComandas = allComandas.filter(comanda => 
    comanda.items.some(item => item.status === 'served')
  );

  // Para "Todos los Pedidos" contar solo pendientes y listos (sin entregados)
  const allActiveComandas = allComandas.filter(comanda => 
    comanda.items.some(item => item.status === 'pending' || item.status === 'ready')
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <KDSHeader 
          screenName={screen?.name || 'Pantalla de Cocina'}
          soundEnabled={soundEnabled}
          onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        />
        <EmptyState type="loading" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <KDSHeader 
          screenName={screen?.name || 'Pantalla de Cocina'}
          soundEnabled={soundEnabled}
          onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        />
        <EmptyState type="error" error={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <KDSHeader 
        screenName={screen?.name || 'Pantalla de Cocina'}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
      />
      
      <StatusTabs
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        totalOrders={allActiveComandas}
        pendingOrders={pendingComandas.length}
        readyOrders={readyComandas.length}
        servedOrders={servedComandas.length}
      />
      
      <div className="p-6">
      {filteredComandas.length === 0 ? (
          <EmptyState type="empty" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredComandas.map((comanda) => (
              <OrderCard
                key={comanda.id}
                order={comanda as any}
                onItemStatusChange={handleItemStatusChange}
                onMarkAllReady={handleMarkAllReady}
                onMarkOrderServed={handleMarkOrderServed}
                onDeleteItem={handleDeleteItem}
              />
                  ))}
                </div>
              )}
            </div>
    </div>
  );
}