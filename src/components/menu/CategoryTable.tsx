'use client';

import { useState } from 'react';
import { Edit, Trash2, Eye, EyeOff, Plus, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Category } from '@/lib/types';

interface CategoryTableProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onToggleActive: (category: Category) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

export function CategoryTable({ 
  categories, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onCreateNew,
  isLoading = false 
}: CategoryTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (category: Category) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) {
      setDeletingId(category.id);
      try {
        await onDelete(category);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Categorías del Menú</h2>
        <Button onClick={onCreateNew} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Nueva Categoría</span>
        </Button>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Utensils className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay categorías</h3>
          <p className="text-gray-500 mb-4">Comienza creando tu primera categoría para organizar tu menú</p>
          <Button onClick={onCreateNew}>
            Crear Primera Categoría
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creada
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {category.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      category.active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {category.active ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(category.created_at).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleActive(category)}
                        className="text-gray-900 hover:text-gray-700"
                        title={category.active ? 'Desactivar' : 'Activar'}
                      >
                        {category.active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(category)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category)}
                        disabled={deletingId === category.id}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
