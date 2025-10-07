'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
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
    color: 'teal',
    component: StockMovementsModule
  },
  {
    id: 'transfers',
    title: 'Transferencias',
    description: 'Entre almacenes',
    icon: ArrowLeftRight,
    color: 'blue',
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
  
  // Mapa de clases para colores (evita clases dinámicas que Tailwind no genere)
  const colorStyles: Record<string, { text: string; border: string }> = {
    blue:   { text: 'text-blue-600',   border: 'border-blue-600' },
    green:  { text: 'text-green-600',  border: 'border-green-600' },
    purple: { text: 'text-purple-600', border: 'border-purple-600' },
    orange: { text: 'text-orange-600', border: 'border-orange-600' },
    teal:   { text: 'text-teal-600',   border: 'border-teal-600' },
    gray:   { text: 'text-gray-600',   border: 'border-gray-600' }
  };
  
  // Estados para modales globales
  const [globalModal, setGlobalModal] = useState<{
    isOpen: boolean;
    type: 'inventory' | 'category' | 'product' | 'batch' | 'movement' | 'transfer' | 'history' | null;
    title: string;
    content: React.ReactNode;
  }>({
    isOpen: false,
    type: null,
    title: '',
    content: null
  });

  const [globalConfirmationModal, setGlobalConfirmationModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    loading?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    loading: false
  });

  // Obtener el módulo activo
  const activeModule = inventoryModules.find(module => module.id === activeTab);
  const ActiveComponent = activeModule?.component || InventoriesModule;

  return (
    <div className="min-h-screen bg-gray-50">

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
                      ? `${colorStyles[module.color]?.text || 'text-gray-600'} ${colorStyles[module.color]?.border || 'border-gray-600'} font-semibold`
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? (colorStyles[module.color]?.text || 'text-gray-600') : ''}`} />
                  <span className="font-medium">{module.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenido del módulo activo */}
      <div className="w-full h-full">
        {/* Renderizar el componente del módulo activo */}
        <div className="w-full h-full">
          <ActiveComponent 
            onOpenModal={(type, title, content) => {
              setGlobalModal({
                isOpen: true,
                type: type as any,
                title,
                content
              });
            }}
            onOpenConfirmationModal={(title, message, onConfirm, loading = false) => {
              setGlobalConfirmationModal({
                isOpen: true,
                title,
                message,
                onConfirm,
                loading
              });
            }}
            onCloseModal={() => {
              setGlobalModal({ isOpen: false, type: null, title: '', content: null });
            }}
          />
        </div>
      </div>

      {/* Modal Global */}
      <Modal
        isOpen={globalModal.isOpen}
        onClose={() => setGlobalModal({ isOpen: false, type: null, title: '', content: null })}
        title={globalModal.title}
      >
        {globalModal.content}
      </Modal>

      {/* Confirmation Modal Global */}
      <ConfirmationModal
        isOpen={globalConfirmationModal.isOpen}
        onClose={() => setGlobalConfirmationModal({ isOpen: false, title: '', message: '', onConfirm: () => {} })}
        onConfirm={globalConfirmationModal.onConfirm}
        title={globalConfirmationModal.title}
        message={globalConfirmationModal.message}
        loading={globalConfirmationModal.loading}
      />
    </div>
  );
}
