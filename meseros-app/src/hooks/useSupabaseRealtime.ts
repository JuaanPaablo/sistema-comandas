import { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabase';
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


    // Crear canal de suscripción
    const channel = supabase
      .channel(`meseros_${table}_changes`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table
        },
        (payload) => {
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
          onDelete?.(payload);
        }
      )
      .subscribe((status) => {
        
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR') {
          setIsConnected(false);
          setError(`Error en canal de ${table}`);
          console.error(`Error en canal de ${table}`);
        } else if (status === 'TIMED_OUT') {
          setIsConnected(false);
          setError(`Timeout en canal de ${table}`);
          console.error(`Timeout en canal de ${table}`);
        } else if (status === 'CLOSED') {
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    // Cleanup
    return () => {
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
