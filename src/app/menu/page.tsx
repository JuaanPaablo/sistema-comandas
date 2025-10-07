'use client';

import { useState } from 'react';
import { HierarchicalMenuView } from '@/components/menu/HierarchicalMenuView';
import { TablesModule } from '@/components/menu/TablesModule';
import { Utensils, Table as TableIcon } from 'lucide-react';

export default function MenuPage() {
  const [activeTab, setActiveTab] = useState<'menu' | 'tables'>('menu');

  const tabs = [
    {
      id: 'menu' as const,
      label: 'Menú',
      icon: Utensils,
      component: <HierarchicalMenuView />
    },
    {
      id: 'tables' as const,
      label: 'Mesas',
      icon: TableIcon,
      component: <TablesModule />
    }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Utensils className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión del Menú</h1>
            <p className="text-gray-600">Administra categorías, platillos, variantes y mesas de tu restaurante</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div>
        {tabs.find(tab => tab.id === activeTab)?.component}
      </div>
    </div>
  );
}
