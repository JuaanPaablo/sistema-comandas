'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Warehouse, 
  Tags, 
  Package, 
  Box, 
  TrendingUp, 
  ArrowLeftRight,
  History,
  Plus,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';

// Importar los componentes de cada módulo
import InventoriesModule from './components/InventoriesModule';
import CategoriesModule from './components/CategoriesModule';
import ProductsModule from './components/ProductsModule';
import BatchesModule from './components/BatchesModule';
import StockMovementsModule from './components/StockMovementsModule';
import TransfersModule from './components/TransfersModule';
import HistoryModule from './components/HistoryModule';

// Definir los módulos disponibles
const inventoryModules = [
  {
    id: 'inventories',
    title: 'Inventarios',
    description: 'Almacenes y ubicaciones',
    icon: Warehouse,
    color: 'blue',
    component: InventoriesModule
  },
  {
    id: 'categories',
    title: 'Categorías',
    description: 'Clasificación de productos',
    icon: Tags,
    color: 'green',
    component: CategoriesModule
  },
  {
    id: 'products',
    title: 'Productos',
    description: 'Gestión de inventario base',
    icon: Package,
    color: 'purple',
    component: ProductsModule
  },
  {
    id: 'batches',
    title: 'Lotes',
    description: 'Control de fechas y costos',
    icon: Box,
    color: 'orange',
    component: BatchesModule
  },
  {
    id: 'movements',
    title: 'Movimientos',
    description: 'Entradas, salidas y ajustes',
    icon: TrendingUp,
    color: 'indigo',
    component: StockMovementsModule
  },
  {
    id: 'transfers',
    title: 'Transferencias',
    description: 'Entre almacenes',
    icon: ArrowLeftRight,
    color: 'teal',
    component: TransfersModule
  },
  {
    id: 'history',
    title: 'Historial',
    description: 'Registro de operaciones',
    icon: History,
    color: 'gray',
    component: HistoryModule
  }
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('inventories');

  // Obtener el módulo activo
  const activeModule = inventoryModules.find(module => module.id === activeTab);
  const ActiveComponent = activeModule?.component || InventoriesModule;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Principal */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  ← Volver al Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">📦 Módulo de Inventario</h1>
                <p className="text-gray-600 mt-2">
                  Sistema completo de gestión de inventario para tu restaurante
                </p>
              </div>
            </div>
            
            {/* Acciones rápidas */}
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="sm">
                <Search className="w-4 h-4 mr-2" />
                Búsqueda Global
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Top Sidebar - Tabs de navegación */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 overflow-x-auto">
            {inventoryModules.map((module) => {
              const Icon = module.icon;
              const isActive = activeTab === module.id;
              
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveTab(module.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 transition-all duration-200 whitespace-nowrap ${
                    isActive 
                      ? `text-${module.color}-600 border-${module.color}-600 font-semibold` 
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? `text-${module.color}-600` : ''}`} />
                  <span className="font-medium">{module.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenido del módulo activo */}
      <div className="container mx-auto px-4 py-8">
        {/* Header del módulo */}
        {activeModule && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-lg bg-${activeModule.color}-100`}>
                  <activeModule.icon className={`w-8 h-8 text-${activeModule.color}-600`} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{activeModule.title}</h2>
                  <p className="text-gray-600">{activeModule.description}</p>
                </div>
              </div>
              
              {/* Acciones específicas del módulo */}
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo {activeModule.title.slice(0, -1)}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Renderizar el componente del módulo activo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
