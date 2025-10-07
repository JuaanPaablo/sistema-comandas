'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertTriangle, User, Timer, X } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  dish_name: string;
  status: 'pending' | 'ready' | 'served';
  selected_variants?: Array<{ name: string; price_adjustment: number }>;
  notes?: string;
}

interface OrderCardProps {
  order: {
    id: string;
    table_number: string;
    employee_name: string;
    created_at: string;
    items: OrderItem[];
    notes?: string;
    service_type?: 'local' | 'takeaway';
    table_info?: {
      id: string;
      number: number;
      capacity: number;
      status: string;
    } | null;
  };
  onItemStatusChange: (itemId: string, newStatus: 'ready' | 'served') => void;
  onMarkAllReady: (orderId: string) => void;
  onMarkOrderServed: (orderId: string) => void;
  onDeleteItem: (itemId: string) => void;
}

// Componente de cronómetro en tiempo real
const RealtimeTimer: React.FC<{ createdAt: string; isPending: boolean }> = ({ createdAt, isPending }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isPending) return;

    const updateTimer = () => {
      const now = Date.now();
      const created = new Date(createdAt).getTime();
      const elapsedSeconds = Math.floor((now - created) / 1000);
      setElapsed(elapsedSeconds);
    };

    // Actualizar inmediatamente
    updateTimer();

    // Actualizar cada segundo
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt, isPending]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const isOverdue = elapsed > 900; // 15 minutos = 900 segundos

  return (
    <div className={`flex items-center gap-1 text-sm ${
      isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
    }`}>
      <Timer className="w-3 h-3" />
      <span>{formatTime(elapsed)}</span>
      {isOverdue && <AlertTriangle className="w-3 h-3" />}
    </div>
  );
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onItemStatusChange,
  onMarkAllReady,
  onMarkOrderServed,
  onDeleteItem
}) => {
  const pendingItems = order.items.filter(item => item.status === 'pending');
  const readyItems = order.items.filter(item => item.status === 'ready');
  const servedItems = order.items.filter(item => item.status === 'served');
  const allItemsReady = pendingItems.length === 0 && readyItems.length > 0;
  const allItemsServed = pendingItems.length === 0 && readyItems.length === 0 && servedItems.length > 0;

  const handleDeleteItem = (itemId: string, itemName: string) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${itemName}" de esta orden?`)) {
      onDeleteItem(itemId);
    }
  };
  
  // Determinar color del header basado en estado
  const headerColor = allItemsServed ? 'bg-blue-100 border-blue-200' : 
                     allItemsReady ? 'bg-green-100 border-green-200' : 
                     'bg-orange-100 border-orange-200';
  const statusColor = allItemsServed ? 'bg-blue-500' : 
                      allItemsReady ? 'bg-green-500' : 
                      'bg-orange-500';
  const statusText = allItemsServed ? 'Entregado' : 
                     allItemsReady ? 'Listo' : 
                     'Pendiente';

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Header */}
      <div className={`${headerColor} border-b px-6 py-4`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 rounded-full w-8 h-8 flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">#{order.id.slice(-6)}</h3>
              <p className="text-sm text-gray-600">
                {order.table_info ? `Mesa ${order.table_info.number} (${order.table_info.capacity} personas)` : order.table_number}
              </p>
            </div>
          </div>
          <div className={`${statusColor} text-white px-3 py-1 rounded-full text-sm font-medium`}>
            {statusText}
          </div>
        </div>
        
        {/* Indicador de tipo de servicio debajo del estado */}
        <div className="flex items-center justify-between text-sm mb-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">{order.employee_name}</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600">{new Date(order.created_at).toLocaleTimeString()}</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            order.service_type === 'takeaway' 
              ? 'bg-orange-100 text-orange-700' 
              : 'bg-blue-100 text-blue-700'
          }`}>
            {order.service_type === 'takeaway' ? 'Para Llevar' : 'Para el Local'}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Est: 15 min</span>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-6">
        <div className="space-y-3">
          {order.items.map((item) => {
            const dishName = (item as any).base_dish_name || item.dish_name;

            const variantNoteFromItem = (item as any).variant_note as string | undefined;
            const variantLabelFromItem = (item as any).variant_label as string | undefined;
            const hasVariants = !variantNoteFromItem && item.selected_variants && item.selected_variants.length > 0;
            const variantText = variantNoteFromItem || (hasVariants 
              ? item.selected_variants!.map(v => v.name).join(', ')
              : undefined);
            const variantLabel = variantLabelFromItem || (variantText ? 'Variante' : undefined);
            
            return (
              <div 
                key={item.id} 
                className={`p-4 rounded-lg border transition-all duration-200 ${
                  item.status === 'ready' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        {item.quantity}x {dishName}
                      </span>
                      {item.status === 'ready' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    
                    {/* Variants as Notes */}
                    {variantText && (
                      <div className="text-sm text-red-600 italic mb-2">
                        {variantLabel}: {variantText}
                      </div>
                    )}
                    
                    {/* Item Notes */}
                    {item.notes && (
                      <div className="text-sm text-gray-600 mb-2">
                        {item.notes}
                      </div>
                    )}
                    
                    {/* Timer for pending items */}
                    {item.status === 'pending' && (
                      <RealtimeTimer createdAt={order.created_at} isPending={true} />
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {/* Check Button - Solo mostrar para items que no están servidos */}
                    {item.status !== 'served' && (
                      <button
                        onClick={() => onItemStatusChange(item.id, item.status === 'ready' ? 'served' : 'ready')}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          item.status === 'ready'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'bg-white border-gray-300 hover:border-green-400 hover:bg-green-50'
                        }`}
                      >
                        {item.status === 'ready' && <CheckCircle className="w-4 h-4" />}
                      </button>
                    )}
                    
                    {/* Delete Button - Solo mostrar para items que no están servidos */}
                    {item.status !== 'served' && (
                      <button
                        onClick={() => handleDeleteItem(item.id, `${item.quantity}x ${dishName}`)}
                        className="w-6 h-6 rounded border-2 border-red-300 bg-white hover:border-red-500 hover:bg-red-50 flex items-center justify-center transition-all duration-200"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    )}
                    
                    {/* Indicador de estado entregado */}
                    {item.status === 'served' && (
                      <div className="w-6 h-6 rounded border-2 border-blue-500 bg-blue-500 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          {/* Solo mostrar botones si hay items que no están servidos */}
          {!allItemsServed && (
            <>
              <button
                onClick={() => onMarkAllReady(order.id)}
                disabled={pendingItems.length === 0}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 ${
                  pendingItems.length === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                ✓ Marcar todos listos ({pendingItems.length})
              </button>
              
              {allItemsReady && !allItemsServed && (
                <button 
                  onClick={() => onMarkOrderServed(order.id)}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-md text-sm font-medium transition-all duration-200"
                >
                  ✓ Pedido Listo
                </button>
              )}
            </>
          )}
          
          {/* Indicador de estado entregado */}
          {allItemsServed && (
            <div className="flex-1 py-2 px-3 rounded-md text-sm font-medium bg-blue-500 text-white text-center">
              ✓ Pedido Entregado
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
