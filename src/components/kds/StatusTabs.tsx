'use client';

import React from 'react';

interface StatusTabsProps {
  activeFilter: 'all' | 'pending' | 'ready' | 'served';
  onFilterChange: (filter: 'all' | 'pending' | 'ready' | 'served') => void;
  totalOrders: number;
  pendingOrders: number;
  readyOrders: number;
  servedOrders: number;
}

export const StatusTabs: React.FC<StatusTabsProps> = ({
  activeFilter,
  onFilterChange,
  totalOrders,
  pendingOrders,
  readyOrders,
  servedOrders
}) => {
  const tabs = [
    { id: 'all' as const, label: 'Todos los Pedidos', count: totalOrders },
    { id: 'pending' as const, label: 'Pendientes', count: pendingOrders },
    { id: 'ready' as const, label: 'Listos', count: readyOrders },
    { id: 'served' as const, label: 'Entregados', count: servedOrders }
  ];

  return (
    <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
      <div className="flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onFilterChange(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              activeFilter === tab.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-blue-600 hover:bg-blue-100'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>
    </div>
  );
};
