'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { VariantFormData, Dish } from '@/lib/types';

const variantSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  dish_id: z.string().min(1, 'Debes seleccionar un platillo'),
  price_adjustment: z.number().default(0),
  active: z.boolean().default(true)
});

type VariantFormProps = {
  initialData?: VariantFormData;
  dishes: Dish[];
  onSubmit: (data: VariantFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  preSelectedDishId?: string;
};

export function VariantForm({ initialData, dishes, onSubmit, onCancel, loading = false, preSelectedDishId }: VariantFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid }
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantSchema),
    defaultValues: initialData || {
      name: '',
      dish_id: preSelectedDishId || '',
      price_adjustment: 0,
      active: true
    },
    mode: 'onChange'
  });

  const isEditing = !!initialData;
  const isEditingFromDish = preSelectedDishId && !isEditing;

  const handleFormSubmit = (data: VariantFormData) => {
    onSubmit(data);
  };

     return (
     <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
       {preSelectedDishId && (
         <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
           <p className="text-sm text-green-700">
             <strong>Creando variante para:</strong> {dishes.find(dish => dish.id === preSelectedDishId)?.name}
           </p>
         </div>
         )}
       <div>
         <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
           Nombre de la Variante *
         </label>
        <Input
          id="name"
          type="text"
          placeholder="Ej: Fanta, Coca Cola, Sprite, Pepsi..."
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

             {!isEditing && !preSelectedDishId && (
         <div>
           <label htmlFor="dish_id" className="block text-sm font-medium text-gray-700 mb-2">
             Platillo *
           </label>
           <Select
             id="dish_id"
             options={dishes.filter(dish => dish.active).map(dish => ({
               value: dish.id,
               label: dish.name
             }))}
             placeholder="Selecciona un platillo"
             error={errors.dish_id?.message}
             {...register('dish_id')}
           />
         </div>
       )}

      <div>
        <label htmlFor="price_adjustment" className="block text-sm font-medium text-gray-700 mb-2">
          Ajuste de Precio *
        </label>
        <Input
          id="price_adjustment"
          type="number"
          step="0.50"
          min="-50"
          max="50"
          placeholder="0.00"
          {...register('price_adjustment', { valueAsNumber: true })}
          className={errors.price_adjustment ? 'border-red-500' : ''}
        />
        {errors.price_adjustment && (
          <p className="mt-1 text-sm text-red-600">{errors.price_adjustment.message}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          💡 <strong>Ajuste de Precio:</strong> Si la variante cuesta más o menos que el platillo base, 
          usa números positivos (+) para aumentar o negativos (-) para disminuir. 
          Ej: +2 = $7, -1 = $4 (precio base: $5)
        </p>
      </div>

      {/* Solo mostrar casilla "activo" cuando se está editando una variante inactiva */}
      {initialData && !initialData.active && (
        <div className="flex items-center">
          <input
            id="active"
            type="checkbox"
            {...register('active')}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
            Reactivar Variante
          </label>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!isValid || loading}
          loading={loading}
        >
          {initialData ? 'Actualizar' : 'Crear'} Variante
        </Button>
      </div>
    </form>
  );
}
