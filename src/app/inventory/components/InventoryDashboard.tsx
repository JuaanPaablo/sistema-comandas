'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { AlertTriangle, Package, TrendingUp, DollarSign } from 'lucide-react';
import { InventoryItemWithBatches } from '@/lib/types';

interface InventoryDashboardProps {
  products: InventoryItemWithBatches[];
}

interface DashboardMetrics {
  totalProducts: number;
  expiredProducts: number;
  criticalProducts: number;
  soonToExpireProducts: number;
  totalValue: number;
  lowStockProducts: number;
}

const getExpiryStatus = (expiryDate: string) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: 'expired', days: Math.abs(diffDays) };
  if (diffDays <= 7) return { status: 'critical', days: diffDays };
  if (diffDays <= 30) return { status: 'soon', days: diffDays };
  return { status: 'good', days: diffDays };
};

const calculateFIFOStats = (product: InventoryItemWithBatches) => {
  const batches = product.batches || [];
  const activeBatches = batches
    .filter(batch => batch.active && batch.quantity > 0)
    .sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());

  if (activeBatches.length === 0) return { totalValue: 0, averageCost: 0 };

  const totalValue = activeBatches.reduce((sum, batch) => 
    sum + (batch.quantity * batch.cost_per_unit), 0
  );

  const totalQuantity = activeBatches.reduce((sum, batch) => sum + batch.quantity, 0);
  const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

  return { totalValue, averageCost };
};

export const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ products }) => {
  const metrics: DashboardMetrics = React.useMemo(() => {
    let totalProducts = 0;
    let expiredProducts = 0;
    let criticalProducts = 0;
    let soonToExpireProducts = 0;
    let totalValue = 0;
    let lowStockProducts = 0;

    products.forEach(product => {
      if (!product.active) return;

      totalProducts++;
      
      // Calcular stock actual y verificar stock bajo
      const batches = product.batches || [];
      const currentStock = batches
        .filter(batch => batch.active && batch.quantity > 0)
        .reduce((sum, batch) => sum + batch.quantity, 0);
      
      if (currentStock <= product.min_stock) {
        lowStockProducts++;
      }

      // Calcular valor total FIFO
      const { totalValue: productValue } = calculateFIFOStats(product);
      totalValue += productValue;

      // Verificar productos por vencimiento
      const hasExpired = batches.some(batch => {
        if (!batch.active || batch.quantity <= 0) return false;
        const { status } = getExpiryStatus(batch.expiry_date);
        return status === 'expired';
      });

      const hasCritical = batches.some(batch => {
        if (!batch.active || batch.quantity <= 0) return false;
        const { status } = getExpiryStatus(batch.expiry_date);
        return status === 'critical';
      });

      const hasSoon = batches.some(batch => {
        if (!batch.active || batch.quantity <= 0) return false;
        const { status } = getExpiryStatus(batch.expiry_date);
        return status === 'soon';
      });

      if (hasExpired) expiredProducts++;
      else if (hasCritical) criticalProducts++;
      else if (hasSoon) soonToExpireProducts++;
    });

    return {
      totalProducts,
      expiredProducts,
      criticalProducts,
      soonToExpireProducts,
      totalValue,
      lowStockProducts
    };
  }, [products]);

  const alertCards = [
    {
      title: 'Productos Vencidos',
      value: metrics.expiredProducts,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Críticos (≤7 días)',
      value: metrics.criticalProducts,
      icon: AlertTriangle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'Stock Bajo',
      value: metrics.lowStockProducts,
      icon: Package,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Valor Total',
      value: `$${metrics.totalValue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    }
  ];

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Resumen del Inventario
        </h3>
        <span className="text-sm text-gray-500">
          {metrics.totalProducts} productos activos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {alertCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card 
              key={index} 
              className={`p-4 border-l-4 ${card.borderColor} ${card.bgColor}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className={`text-2xl font-bold ${card.color}`}>
                    {card.value}
                  </p>
                </div>
                <IconComponent className={`w-8 h-8 ${card.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Alertas críticas */}
      {(metrics.expiredProducts > 0 || metrics.criticalProducts > 0) && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-sm font-medium text-red-800">
              ¡Atención requerida! 
              {metrics.expiredProducts > 0 && ` ${metrics.expiredProducts} productos vencidos`}
              {metrics.expiredProducts > 0 && metrics.criticalProducts > 0 && ' y'}
              {metrics.criticalProducts > 0 && ` ${metrics.criticalProducts} productos críticos`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
