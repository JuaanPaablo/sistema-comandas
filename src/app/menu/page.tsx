'use client';

import { HierarchicalMenuView } from '@/components/menu/HierarchicalMenuView';
import { Utensils } from 'lucide-react';

export default function MenuPage() {

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
            <p className="text-gray-600">Administra categorías, platillos y variantes de tu restaurante</p>
          </div>
        </div>
      </div>

            {/* Vista Jerárquica del Menú */}
      <HierarchicalMenuView />
    </div>
  );
}
