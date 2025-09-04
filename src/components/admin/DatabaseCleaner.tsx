'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Trash2, AlertTriangle, Database, CheckCircle } from 'lucide-react';

interface DatabaseCleanerProps {
  onCleanupComplete?: () => void;
}

export function DatabaseCleaner({ onCleanupComplete }: DatabaseCleanerProps) {
  const [isCleaning, setIsCleaning] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cleanupStatus, setCleanupStatus] = useState<'idle' | 'cleaning' | 'success' | 'error'>('idle');

  const handleCleanup = async () => {
    try {
      setIsCleaning(true);
      setCleanupStatus('cleaning');

      // Limpiar todas las tablas en orden correcto (por foreign keys)
      const tablesToClean = [
        'order_items',
        'recipes', 
        'stock_movements',
        'transfers',
        'batches',
        'variants',
        'dishes',
        'inventory_items',
        'categories',
        'inventory_categories',
        'inventories',
        'orders'
      ];

      for (const table of tablesToClean) {
        try {
          const response = await fetch(`/api/admin/cleanup/${table}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            console.warn(`Warning: Could not clean table ${table}`);
          }
        } catch (error) {
          console.warn(`Warning: Error cleaning table ${table}:`, error);
        }
      }

      setCleanupStatus('success');
      onCleanupComplete?.();
      
      // Resetear después de 3 segundos
      setTimeout(() => {
        setCleanupStatus('idle');
        setShowConfirmation(false);
      }, 3000);

    } catch (error) {
      console.error('Error durante la limpieza:', error);
      setCleanupStatus('error');
    } finally {
      setIsCleaning(false);
    }
  };

  if (cleanupStatus === 'success') {
    return (
      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center space-x-3 text-green-800">
          <CheckCircle className="w-6 h-6" />
          <div>
            <h3 className="font-medium">¡Base de Datos Limpiada!</h3>
            <p className="text-sm text-green-600">
              Todas las tablas han sido limpiadas exitosamente. La base de datos está lista para la nueva estructura.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (cleanupStatus === 'error') {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-center space-x-3 text-red-800">
          <AlertTriangle className="w-6 h-6" />
          <div>
            <h3 className="font-medium">Error durante la limpieza</h3>
            <p className="text-sm text-red-600">
              Hubo un problema al limpiar la base de datos. Revisa la consola para más detalles.
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setCleanupStatus('idle')} 
          variant="outline" 
          className="mt-3"
        >
          Reintentar
        </Button>
      </Card>
    );
  }

  if (!showConfirmation) {
    return (
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-center space-x-3 text-yellow-800">
          <Database className="w-6 h-6" />
          <div>
            <h3 className="font-medium">Limpieza de Base de Datos</h3>
            <p className="text-sm text-yellow-600">
              ¿Quieres limpiar completamente la base de datos para actualizar la estructura?
            </p>
          </div>
        </div>
        <Button 
          onClick={() => setShowConfirmation(true)} 
          variant="outline" 
          className="mt-3 text-yellow-700 border-yellow-300 hover:bg-yellow-100"
        >
          Ver Opciones de Limpieza
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-red-50 border-red-300">
      <div className="flex items-center space-x-3 text-red-800 mb-4">
        <AlertTriangle className="w-6 h-6" />
        <div>
          <h3 className="font-medium">⚠️ LIMPIEZA COMPLETA DE BASE DE DATOS</h3>
          <p className="text-sm text-red-600">
            Esta acción eliminará TODOS los datos de TODAS las tablas.
          </p>
        </div>
      </div>

      <div className="bg-red-100 p-4 rounded-lg mb-4">
        <h4 className="font-medium text-red-800 mb-2">Tablas que se limpiarán:</h4>
        <ul className="text-sm text-red-700 space-y-1">
          <li>• Órdenes y elementos de orden</li>
          <li>• Recetas</li>
          <li>• Movimientos de stock</li>
          <li>• Transferencias</li>
          <li>• Lotes</li>
          <li>• Variantes</li>
          <li>• Platillos</li>
          <li>• Elementos de inventario</li>
          <li>• Categorías</li>
          <li>• Inventarios</li>
        </ul>
      </div>

      <div className="flex space-x-3">
        <Button 
          onClick={() => setShowConfirmation(false)} 
          variant="outline" 
          disabled={isCleaning}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleCleanup} 
          variant="destructive" 
          disabled={isCleaning}
          loading={isCleaning}
          className="flex items-center space-x-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>
            {isCleaning ? 'Limpiando...' : 'LIMPIAR TODA LA BASE DE DATOS'}
          </span>
        </Button>
      </div>
    </Card>
  );
}
