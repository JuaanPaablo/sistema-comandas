'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Settings, 
  Trash2, 
  AlertTriangle, 
  Database, 
  RefreshCw,
  Shield,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminPage() {
  const [isCleaning, setIsCleaning] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [cleanupType, setCleanupType] = useState<'all' | 'inventory' | 'menu' | 'employees' | 'orders'>('all');

  // Función para limpiar la base de datos
  const handleCleanup = async (type: string) => {
    setIsCleaning(true);
    try {
      const response = await fetch(`/api/admin/cleanup/${type}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`✅ ${result.message}`);
        // Recargar la página después de 2 segundos
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        toast.error(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error durante la limpieza:', error);
      toast.error('❌ Error de conexión durante la limpieza');
    } finally {
      setIsCleaning(false);
      setShowConfirmDialog(false);
    }
  };

  const cleanupOptions = [
    {
      id: 'all',
      title: 'Limpiar Todo',
      description: 'Elimina TODOS los datos de la base de datos',
      icon: Trash2,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      warning: '⚠️ ESTO ELIMINARÁ TODOS LOS DATOS PERMANENTEMENTE'
    },
    {
      id: 'inventory',
      title: 'Limpiar Inventario',
      description: 'Elimina productos, lotes, movimientos y transferencias',
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      warning: 'Se eliminarán todos los datos del inventario'
    },
    {
      id: 'menu',
      title: 'Limpiar Menú',
      description: 'Elimina platillos, categorías y variantes',
      icon: RefreshCw,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      warning: 'Se eliminarán todos los datos del menú'
    },
    {
      id: 'employees',
      title: 'Limpiar Empleados',
      description: 'Elimina empleados y sesiones de trabajo',
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      warning: 'Se eliminarán todos los datos de empleados'
    },
    {
      id: 'orders',
      title: 'Limpiar Órdenes',
      description: 'Elimina órdenes y asignaciones',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      warning: 'Se eliminarán todos los datos de órdenes'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-red-100">
                <Settings className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">⚙️ Administración</h1>
                <p className="text-gray-600 mt-2">
                  Herramientas de administración y limpieza de base de datos
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-4 py-8">
        {/* Advertencia de seguridad */}
        <div className="mb-8">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800 mb-2">
                    ⚠️ ZONA DE PELIGRO
                  </h3>
                  <p className="text-red-700 mb-3">
                    Esta sección contiene herramientas que pueden eliminar datos permanentemente. 
                    <strong> Úsala solo para pruebas y desarrollo.</strong>
                  </p>
                  <div className="bg-red-100 border border-red-300 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-medium">
                      💡 Recomendación: Haz una copia de seguridad antes de usar estas herramientas
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Herramientas de limpieza */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cleanupOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card 
                key={option.id} 
                className={`${option.borderColor} hover:shadow-lg transition-shadow cursor-pointer`}
                onClick={() => {
                  setCleanupType(option.id as any);
                  setShowConfirmDialog(true);
                }}
              >
                <CardHeader className={`${option.bgColor} rounded-t-lg`}>
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-6 h-6 ${option.color}`} />
                    <CardTitle className={`text-lg ${option.color}`}>
                      {option.title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-gray-600 mb-4">{option.description}</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 font-medium">
                      {option.warning}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Información adicional */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span>Información de la Base de Datos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Tablas Principales</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• employees (empleados)</li>
                    <li>• inventory_items (productos)</li>
                    <li>• batches (lotes)</li>
                    <li>• stock_movements (movimientos)</li>
                    <li>• dishes (platillos)</li>
                    <li>• recipes (recetas)</li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Orden de Limpieza</h4>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Órdenes y asignaciones</li>
                    <li>2. Sesiones de empleados</li>
                    <li>3. Empleados</li>
                    <li>4. Recetas</li>
                    <li>5. Inventario</li>
                    <li>6. Menú</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
                <h3 className="text-xl font-bold text-gray-900">
                  Confirmar Limpieza
                </h3>
              </div>
              
              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que quieres eliminar{' '}
                <strong>
                  {cleanupType === 'all' ? 'TODOS los datos' : 
                   cleanupType === 'inventory' ? 'todos los datos del inventario' :
                   cleanupType === 'menu' ? 'todos los datos del menú' :
                   cleanupType === 'employees' ? 'todos los datos de empleados' :
                   'todos los datos de órdenes'}
                </strong>?
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
                <p className="text-sm text-red-800 font-medium">
                  ⚠️ Esta acción no se puede deshacer
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="flex-1"
                  disabled={isCleaning}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => handleCleanup(cleanupType)}
                  disabled={isCleaning}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isCleaning ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Limpiando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
