'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, Package, Activity } from 'lucide-react';
import { StockMovement, InventoryItem } from '@/lib/types';

interface MovementsDashboardProps {
  movements: StockMovement[];
  products: InventoryItem[];
}

interface MovementTypeInfo {
  value: string;
  label: string;
  icon: any;
  color: string;
  bgColor: string;
}

const movementTypeOptions: MovementTypeInfo[] = [
  { value: 'ajuste_positivo', label: 'Ajuste Positivo (+)', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
  { value: 'ajuste_negativo', label: 'Ajuste Negativo (-)', icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-100' }
];

export const MovementsDashboard: React.FC<MovementsDashboardProps> = ({ movements, products }) => {
  const getProductName = (id: string) => {
    return products.find(product => product.id === id)?.name || 'N/A';
  };

  const getMovementTypeInfo = (type: string) => {
    return movementTypeOptions.find(option => option.value === type) || movementTypeOptions[0];
  };

  const metrics = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayMovements = movements.filter(movement => 
      movement.active && movement.created_at.startsWith(today)
    );
    
    const todayStats = todayMovements.reduce((acc, movement) => {
      if (movement.movement_type === 'ajuste_positivo') {
        acc.positive += movement.quantity;
      } else {
        acc.negative += movement.quantity;
      }
      acc.total = acc.positive - acc.negative;
      return acc;
    }, { positive: 0, negative: 0, total: 0 });

    return {
      todayMovements,
      todayStats,
      totalMovements: movements.filter(m => m.active).length
    };
  }, [movements]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          Resumen de Ajustes de Inventario
        </h3>
                 <span className="text-sm text-gray-900">
          {metrics.totalMovements} ajustes registrados
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card className="p-4 border-l-4 border-green-500 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
                             <p className="text-sm font-medium text-gray-900">Ajustes Positivos</p>
              <p className="text-2xl font-bold text-green-600">
                +{metrics.todayStats.positive.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
                             <p className="text-sm font-medium text-gray-900">Ajustes Negativos</p>
              <p className="text-2xl font-bold text-red-600">
                -{metrics.todayStats.negative.toFixed(2)}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card className={`p-4 border-l-4 ${metrics.todayStats.total >= 0 ? 'border-blue-500 bg-blue-50' : 'border-orange-500 bg-orange-50'}`}>
          <div className="flex items-center justify-between">
            <div>
                             <p className="text-sm font-medium text-gray-900">Balance del Día</p>
              <p className={`text-2xl font-bold ${metrics.todayStats.total >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {metrics.todayStats.total >= 0 ? '+' : ''}{metrics.todayStats.total.toFixed(2)}
              </p>
            </div>
            <Package className={`w-8 h-8 ${metrics.todayStats.total >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          </div>
        </Card>
      </div>

      {/* Movimientos recientes del día */}
      {metrics.todayMovements.length > 0 && (
        <Card className="p-4">
                     <h4 className="text-sm font-medium text-gray-900 mb-3">Ajustes Recientes de Hoy ({metrics.todayMovements.length})</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {metrics.todayMovements.slice(0, 5).map((movement) => {
              const typeInfo = getMovementTypeInfo(movement.movement_type);
              const sign = movement.movement_type === 'ajuste_positivo' ? '+' : '-';
              return (
                <div key={movement.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${typeInfo.bgColor}`}></div>
                                         <span className="text-gray-900">
                      {new Date(movement.created_at).toLocaleTimeString('es-ES', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    <span className="font-medium">{getProductName(movement.inventory_item_id)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${typeInfo.color}`}>
                      {sign}{movement.quantity}
                    </span>
                                         <span className="text-gray-900 text-xs">({movement.reason.slice(0, 20)}...)</span>
                  </div>
                </div>
              );
            })}
            {metrics.todayMovements.length > 5 && (
                             <p className="text-xs text-gray-900 text-center pt-2">
                y {metrics.todayMovements.length - 5} ajustes más...
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Alerta si hay muchas pérdidas */}
      {metrics.todayStats.negative > metrics.todayStats.positive && (
        <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <TrendingDown className="w-5 h-5 text-orange-600 mr-2" />
                                      <span className="text-sm font-medium text-orange-900">
               ⚠️ Atención: Más ajustes negativos que positivos hoy
             </span>
          </div>
        </div>
      )}
    </div>
  );
};
