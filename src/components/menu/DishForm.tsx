'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DishFormData, Category } from '@/lib/types';

const dishSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  category_id: z.string().min(1, 'Debes seleccionar una categoría'),
  active: z.boolean().default(true)
});

type DishFormProps = {
  initialData?: DishFormData;
  categories: Category[];
  onSubmit: (data: DishFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  preSelectedCategoryId?: string;
};

export function DishForm({ initialData, categories, onSubmit, onCancel, loading = false, preSelectedCategoryId }: DishFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<DishFormData>({
    resolver: zodResolver(dishSchema),
    defaultValues: initialData || {
      name: '',
      price: 0,
      category_id: preSelectedCategoryId || '',
      active: true
    },
    mode: 'onChange'
  });

  const handleFormSubmit = (data: DishFormData) => {
    onSubmit(data);
  };

  const isEditing = !!initialData;
  const isEditingFromCategory = preSelectedCategoryId && !isEditing;

     return (
     <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
       {preSelectedCategoryId && (
         <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
           <p className="text-sm text-blue-700">
             <strong>Creando platillo en:</strong> {categories.find(cat => cat.id === preSelectedCategoryId)?.name}
           </p>
         </div>
       )}
       <div>
         <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
           Nombre del Platillo *
         </label>
        <Input
          id="name"
          type="text"
          placeholder="Ej: Hamburguesa Clásica, Pasta Carbonara..."
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

             {!isEditing && !preSelectedCategoryId && (
         <div>
           <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-2">
             Categoría *
           </label>
           <Select
             id="category_id"
             options={categories.filter(cat => cat.active).map(category => ({
               value: category.id,
               label: category.name
             }))}
             placeholder="Selecciona una categoría"
             error={errors.category_id?.message}
             {...register('category_id')}
           />
         </div>
       )}

      <div>
        <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
          Precio *
        </label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          {...register('price', { valueAsNumber: true })}
          className={errors.price ? 'border-red-500' : ''}
        />
        {errors.price && (
          <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
        )}
      </div>

      {/* Solo mostrar casilla "activo" cuando se está editando un platillo inactivo */}
      {initialData && !initialData.active && (
        <div className="flex items-center">
          <input
            id="active"
            type="checkbox"
            {...register('active')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
            Reactivar Platillo
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
          {initialData ? 'Actualizar' : 'Crear'} Platillo
        </Button>
      </div>
    </form>
  );
}
