'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CategoryFormData } from '@/lib/types';

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  active: z.boolean()
});

type CategoryFormProps = {
  initialData?: CategoryFormData;
  onSubmit: (data: CategoryFormData) => void;
  onCancel: () => void;
  loading?: boolean;
};

export function CategoryForm({ initialData, onSubmit, onCancel, loading = false }: CategoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: initialData || {
      name: '',
      active: true
    },
    mode: 'onChange'
  });

  const handleFormSubmit = (data: CategoryFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre de la Categoría *
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Ej: Carnes, Bebidas, Postres..."
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Solo mostrar casilla "activo" cuando se está editando una categoría inactiva */}
      {initialData && !initialData.active && (
        <div className="flex items-center">
          <input
            id="active"
            type="checkbox"
            {...register('active')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
            Reactivar Categoría
          </label>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!isValid || loading}
          loading={loading}
          className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {initialData ? 'Actualizar' : 'Crear'} Categoría
        </Button>
      </div>
    </form>
  );
}
