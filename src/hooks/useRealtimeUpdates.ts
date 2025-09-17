import { useEffect, useRef, useState, useCallback } from 'react';

interface RealtimeConfig {
  interval?: number;
  enabled?: boolean;
  onUpdate?: () => void;
  screenId?: string;
}

export const useRealtimeUpdates = (config: RealtimeConfig = {}) => {
  const { interval = 1500, enabled = true, onUpdate, screenId } = config;
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  const performUpdate = useCallback(async () => {
    if (!onUpdate) return;
    
    try {
      await onUpdate();
      setLastUpdate(new Date());
      retryCountRef.current = 0; // Reset retry count on success
    } catch (error) {
      console.error('Error en actualización en tiempo real:', error);
      retryCountRef.current++;
      
      if (retryCountRef.current >= maxRetries) {
        console.warn('Máximo de reintentos alcanzado, pausando actualizaciones');
        setIsConnected(false);
        return;
      }
    }
  }, [onUpdate]);

  useEffect(() => {
    if (!enabled || !screenId) {
      setIsConnected(false);
      return;
    }

    const startPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      console.log(`🔄 Iniciando polling cada ${interval}ms para pantalla ${screenId}`);
      
      intervalRef.current = setInterval(() => {
        performUpdate();
      }, interval);

      setIsConnected(true);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsConnected(false);
    };

    startPolling();

    return () => {
      stopPolling();
    };
  }, [enabled, interval, onUpdate, screenId, performUpdate]);

  const forceUpdate = useCallback(async () => {
    console.log('🔄 Forzando actualización manual');
    await performUpdate();
  }, [performUpdate]);

  const reconnect = useCallback(() => {
    console.log('🔄 Reconectando...');
    retryCountRef.current = 0;
    setIsConnected(true);
  }, []);

  return {
    isConnected,
    lastUpdate,
    forceUpdate,
    reconnect
  };
};
