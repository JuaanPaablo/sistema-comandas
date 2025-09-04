'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CategoryService } from '@/lib/services/menuService';
import type { Category, CategoryFormData } from '@/lib/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    active: true
  });

  // Cargar categorías
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await CategoryService.getAll();
      
      if (response.error) {
        setError(response.error);
      } else {
        setCategories(response.data || []);
      }
    } catch (err) {
      setError('Error al cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Limpiar formulario
  const clearForm = () => {
    setFormData({ name: '', active: true });
    setEditingCategory(null);
    setShowForm(false);
  };

  // Crear o actualizar categoría
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('El nombre de la categoría es requerido');
      return;
    }

    try {
      setLoading(true);
      let response;

      if (editingCategory) {
        // Actualizar
        response = await CategoryService.update(editingCategory.id, formData);
      } else {
        // Crear
        response = await CategoryService.create(formData);
      }

      if (response.error) {
        setError(response.error);
      } else {
        await loadCategories();
        clearForm();
        setError(null);
      }
    } catch (err) {
      setError('Error al guardar la categoría');
    } finally {
      setLoading(false);
    }
  };

  // Editar categoría
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      active: category.active
    });
    setShowForm(true);
  };

  // Eliminar categoría
  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await CategoryService.delete(id);
      
      if (response.error) {
        setError(response.error);
      } else {
        await loadCategories();
        setError(null);
      }
    } catch (err) {
      setError('Error al eliminar la categoría');
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado activo
  const handleToggleActive = async (category: Category) => {
    try {
      setLoading(true);
      const response = await CategoryService.update(category.id, {
        active: !category.active
      });
      
      if (response.error) {
        setError(response.error);
      } else {
        await loadCategories();
        setError(null);
      }
    } catch (err) {
      setError('Error al cambiar el estado de la categoría');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Link 
            href="/menu" 
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← Volver al menú
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          📂 Gestión de Categorías
        </h1>
        <p className="text-lg text-gray-600">
          Administra las categorías de tu menú. Las categorías te ayudan a organizar 
          los platillos de manera lógica y eficiente.
        </p>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle>
            {editingCategory ? '✏️ Editar Categoría' : '➕ Nueva Categoría'}
          </CardTitle>
          <CardDescription>
            {editingCategory 
              ? 'Modifica los datos de la categoría seleccionada'
              : 'Crea una nueva categoría para organizar tu menú'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre de la Categoría"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Carnes, Bebidas, Postres"
                required
              />
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">
                  Categoría Activa
                </label>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button type="submit" loading={loading}>
                {editingCategory ? 'Actualizar' : 'Crear'} Categoría
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={clearForm}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de categorías */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Categorías Existentes</CardTitle>
          <CardDescription>
            {categories.length === 0 
              ? 'No hay categorías creadas aún'
              : `Total de categorías: ${categories.length}`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Cargando categorías...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No hay categorías creadas. ¡Crea tu primera categoría!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div 
                  key={category.id} 
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${category.active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <div>
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-500">
                        Estado: {category.active ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(category)}
                    >
                      ✏️ Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={category.active ? "secondary" : "primary"}
                      onClick={() => handleToggleActive(category)}
                    >
                      {category.active ? '🔴 Desactivar' : '🟢 Activar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(category.id)}
                    >
                      🗑️ Eliminar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Consejos para Categorías</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-800">
            <p>• <strong>Nombres claros:</strong> Usa nombres descriptivos como "Carnes Rojas", "Bebidas Alcohólicas"</p>
            <p>• <strong>Organización lógica:</strong> Agrupa platillos similares en la misma categoría</p>
            <p>• <strong>Estado activo:</strong> Solo las categorías activas aparecerán en el menú</p>
            <p>• <strong>Eliminación:</strong> Al eliminar una categoría, se desactiva (soft delete)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
