import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UseSupabaseRealtimeOptions {
  table: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  enabled?: boolean;
}

export const useSupabaseRealtime = ({
  table,
  onInsert,
  onUpdate,
  onDelete,
  enabled = true
}: UseSupabaseRealtimeOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    console.log(`🔄 [${table}] Configurando suscripción Real-time...`);

    // Verificar que Supabase esté configurado correctamente
    if (!supabase) {
      console.error(`❌ [${table}] Supabase no está configurado`);
      setError('Supabase no está configurado');
      return;
    }

    // Crear canal de suscripción con configuración más robusta
    const channel = supabase
      .channel(`${table}_changes_${Date.now()}`, {
        config: {
          broadcast: { self: true },
          presence: { key: 'test' }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`➕ [${table}] INSERT recibido:`, payload);
          onInsert?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`✏️ [${table}] UPDATE recibido:`, payload);
          onUpdate?.(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: table
        },
        (payload) => {
          console.log(`🗑️ [${table}] DELETE recibido:`, payload);
          onDelete?.(payload);
        }
      )
      .subscribe((status, err) => {
        console.log(`📡 [${table}] Estado de suscripción:`, status, err ? `Error: ${err}` : '');
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
          console.log(`✅ [${table}] Suscrito exitosamente`);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError(`Error en canal de ${table}: ${err?.message || 'Error desconocido'}`);
          console.error(`❌ [${table}] Error en canal:`, err);
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setError(`Timeout en canal de ${table}`);
          console.error(`⏰ [${table}] Timeout en canal`);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
          console.log(`🔒 [${table}] Canal cerrado`);
        } else {
          console.log(`🔄 [${table}] Estado: ${status}`);
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
      console.log(`🧹 [${table}] Limpiando suscripción...`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [table, enabled, onInsert, onUpdate, onDelete]);

  return {
    isConnected,
    error,
    channel: channelRef.current
  };
};
