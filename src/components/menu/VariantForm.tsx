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
    <div className="space-y-8">
      {/* Header del modal */}
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
          <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {initialData ? 'Editar Variante' : 'Agregar Variantes al Platillo'}
        </h3>
        <p className="text-gray-600">
          {initialData ? 'Modifica los detalles de la variante' : 'Configura las opciones personalizables para este platillo'}
        </p>
      </div>

      {/* Información del platillo */}
      {preSelectedDishId && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">
                Agregando variantes para: <span className="font-bold">{dishes.find(dish => dish.id === preSelectedDishId)?.name}</span>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Precio base: ${dishes.find(dish => dish.id === preSelectedDishId)?.price} (todas las variantes tendrán el mismo precio)
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Nombre de la variante */}
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-semibold text-gray-900">
            Nombre de la Variante *
          </label>
          <Input
            id="name"
            type="text"
            placeholder="Ej: Fanta, Coca Cola, Sprite, Pepsi..."
            {...register('name')}
            className={`${errors.name ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} transition-colors duration-200`}
          />
          {errors.name && (
            <p className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Selección de platillo */}
        {!isEditing && !preSelectedDishId && (
          <div className="space-y-2">
            <label htmlFor="dish_id" className="block text-sm font-semibold text-gray-900">
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

        {/* Ajuste de precio */}
        <div className="space-y-3">
          <label htmlFor="price_adjustment" className="block text-sm font-semibold text-gray-900">
            Ajuste de Precio *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <Input
              id="price_adjustment"
              type="number"
              step="0.50"
              min="-50"
              max="50"
              placeholder="0.00"
              {...register('price_adjustment', { valueAsNumber: true })}
              className={`pl-7 ${errors.price_adjustment ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} transition-colors duration-200`}
            />
          </div>
          {errors.price_adjustment && (
            <p className="text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.price_adjustment.message}
            </p>
          )}
          
          {/* Información de ayuda */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Ajuste de Precio</h4>
                <p className="text-sm text-blue-700">
                  Si una variante cuesta más o menos que el precio base, usa números positivos (+) para aumentar o negativos (-) para disminuir.
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  <strong>Ejemplo:</strong> +2 = $7, -1 = $4 (precio base: $5)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estado activo */}
        {initialData && !initialData.active && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <input
                id="active"
                type="checkbox"
                {...register('active')}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="text-sm font-medium text-yellow-800">
                Reactivar esta variante
              </label>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 sm:flex-none px-6 py-3 text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!isValid || loading}
            loading={loading}
            className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {initialData ? 'Actualizar Variante' : 'Crear Variante'}
          </Button>
        </div>
      </form>
    </div>
  );
}
