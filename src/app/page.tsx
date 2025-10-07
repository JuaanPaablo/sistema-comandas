'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { InventoryDashboard } from './inventory/components/InventoryDashboard';
import { MovementsDashboard } from './inventory/components/MovementsDashboard';
import { InventoryItemService, BatchService, StockMovementService } from '@/lib/services/inventoryService';
import { InventoryItemWithBatches, StockMovement, InventoryItem } from '@/lib/types';
import { 
  Utensils, 
  Package, 
  BookOpen, 
  ShoppingCart, 
  TrendingUp,
  CheckCircle,
  Clock,
  Users,
  Shield,
  Monitor,
  DollarSign
} from 'lucide-react';

export default function HomePage() {
  const [inventoryProducts, setInventoryProducts] = useState<InventoryItemWithBatches[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [isLoadingMovements, setIsLoadingMovements] = useState(true);

  // Función para cargar datos del dashboard
  const loadDashboardData = async () => {
    try {
      setIsLoadingInventory(true);
      setIsLoadingMovements(true);
      
      // Cargar todos los datos en paralelo
      const [batchesRes, productsRes, movementsRes, inventoryItemsRes] = await Promise.all([
        BatchService.getAllWithInactive(),
        InventoryItemService.getAllWithStock(),
        StockMovementService.getAllWithInactive(),
        InventoryItemService.getAll()
      ]);

      if (batchesRes.data && productsRes.data) {
        // Agrupar lotes por producto
        const productsWithBatches = productsRes.data.map(product => {
          const productBatches = batchesRes.data!.filter(batch => 
            batch.inventory_item_id === product.id
          );
          
          return {
            ...product,
            batches: productBatches,
            expanded: false
          } as InventoryItemWithBatches;
        });

        setInventoryProducts(productsWithBatches);
      }

      if (movementsRes.data) {
        setMovements(movementsRes.data);
      }

      if (inventoryItemsRes.data) {
        setProducts(inventoryItemsRes.data);
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setIsLoadingInventory(false);
      setIsLoadingMovements(false);
    }
  };

  // Cargar datos del inventario para el dashboard
  useEffect(() => {
    loadDashboardData();
  }, []);

  const modules = [
    {
      title: '🍽️ Menú',
      description: 'Gestión de categorías, platillos y variantes',
      href: '/menu',
      icon: Utensils,
      status: 'implementado',
      features: ['Categorías CRUD', 'Platillos (próximo)', 'Variantes (próximo)']
    },
    {
      title: '📦 Inventario',
      description: 'Control de inventarios, productos y lotes',
      href: '/inventory',
      icon: Package,
      status: 'implementado',
      features: ['Inventarios', 'Categorías', 'Productos', 'Lotes', 'Movimientos', 'Transferencias', 'Historial']
    },
    {
      title: '📚 Recetas',
      description: 'Conexión entre menú e inventario',
      href: '/recetas',
      icon: BookOpen,
      status: 'implementado',
      features: ['Recetas', 'Cálculo de producción', 'Cálculo de costos', 'Validación de stock']
    },
    {
      title: '🍳 Cocina',
      description: 'Pantallas configurable para cocina, bebidas y bar',
      href: '/cocina',
      icon: Monitor,
      status: 'implementado',
      features: ['Pantallas configurables', 'Estados de órdenes', 'Tiempo real', 'Duplicar pantallas']
    },
    {
      title: '👥 Empleados (Operaciones)',
      description: 'Gestión operativa básica del personal',
      href: '/empleados',
      icon: Users,
      status: 'implementado',
      features: ['Registro simple', 'Posición', 'Edición rápida']
    },
    {
      title: '💰 Contabilidad',
      description: 'Gestión financiera completa del negocio',
      href: '/contabilidad',
      icon: DollarSign,
      status: 'implementado',
      features: ['Gestión de Caja', 'Ingresos', 'Egresos', 'Facturación', 'Reportes Financieros']
    },
    {
      title: '🛡️ Administración',
      description: 'Herramientas de administración y limpieza',
      href: '/admin',
      icon: Shield,
      status: 'implementado',
      features: ['Limpieza de BD', 'Herramientas de desarrollo', 'Gestión de datos', 'Respaldo y restauración']
    },
    {
      title: '💰 Caja (Operaciones)',
      description: 'Punto de venta, cobros y gestión de pedidos',
      href: '/caja',
      icon: ShoppingCart,
      status: 'pendiente',
      features: ['Órdenes', 'Pagos', 'Historial', 'Estadísticas']
    }
  ];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'implementado':
        return { color: 'text-green-600', bgColor: 'bg-green-100', icon: CheckCircle, text: 'Implementado' };
      case 'en desarrollo':
        return { color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Clock, text: 'En Desarrollo' };
      case 'pendiente':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Clock, text: 'Pendiente' };
      default:
        return { color: 'text-gray-900', bgColor: 'bg-gray-100', icon: Clock, text: 'Pendiente' };
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard COMANDAS</h1>
              <p className="text-gray-900">Sistema completo de gestión para restaurantes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Utensils className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Módulos Activos</p>
              <p className="text-2xl font-bold text-gray-900">6/7</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Funcionalidades</p>
              <p className="text-2xl font-bold text-gray-900">85%</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">En Desarrollo</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-900">Base de Datos</p>
              <p className="text-2xl font-bold text-gray-900">✅</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Dashboard de Inventario */}
      {!isLoadingInventory && inventoryProducts.length > 0 && (
        <div className="mb-8">
          <InventoryDashboard products={inventoryProducts} />
        </div>
      )}

      {/* Dashboard de Movimientos */}
      {!isLoadingMovements && movements.length > 0 && (
        <div className="mb-8">
          <MovementsDashboard movements={movements} products={products} />
        </div>
      )}

      {/* Módulos del sistema */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Módulos del Sistema</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module) => {
            const statusInfo = getStatusInfo(module.status);
            const Icon = module.icon;
            const StatusIcon = statusInfo.icon;
            
            return (
              <Card key={module.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{module.title}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bgColor} ${statusInfo.color}`}>
                      <div className="flex items-center space-x-1">
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusInfo.text}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {module.features.map((feature, index) => (
                      <li key={index} className="flex items-center space-x-2 text-sm text-gray-900">
                        <span className="text-green-500">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={module.href}>
                    <Button 
                      className="w-full" 
                      variant={module.status === 'implementado' ? 'primary' : 'outline'}
                      disabled={module.status === 'pendiente'}
                    >
                      {module.status === 'implementado' ? 'Gestionar' : 'Próximamente'}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>


      {/* Información del sistema */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">ℹ️ Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-blue-800">
            <p>
              <strong>COMANDAS</strong> es un sistema completo de gestión para restaurantes que incluye:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Menú:</strong> Gestión completa de categorías, platillos y variantes</li>
              <li><strong>Inventario:</strong> Control de stock, lotes y movimientos</li>
              <li><strong>Recetas:</strong> Conexión entre menú e inventario con cálculo de costos</li>
              <li><strong>Punto de Venta:</strong> Sistema de órdenes y gestión de ventas</li>
            </ul>
            <p className="text-sm">
              El sistema está construido con Next.js 14, TypeScript, Tailwind CSS y Supabase para la base de datos.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
