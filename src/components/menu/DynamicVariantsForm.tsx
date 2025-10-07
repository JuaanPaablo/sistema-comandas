'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { Dish } from '@/lib/types';

interface VariantField {
  id: string;
  name: string;
  priceAdjustment: number;
}

interface DynamicVariantsFormProps {
  dish: Dish;
  onSubmit: (variants: { name: string; priceAdjustment: number }[], selectionText: string, maxSelections: number) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function DynamicVariantsForm({ dish, onSubmit, onCancel, loading = false }: DynamicVariantsFormProps) {
  const [variants, setVariants] = useState<VariantField[]>([{ id: '1', name: '', priceAdjustment: 0 }]);
  const [selectionText, setSelectionText] = useState('Escoja una variante');
  const [maxSelections, setMaxSelections] = useState(1);
  const [nextId, setNextId] = useState(2); // Contador incremental

  const addVariant = () => {
    const newId = nextId.toString();
    setNextId(nextId + 1); // Incrementar para la próxima variante
    const newVariants = [...variants, { id: newId, name: '', priceAdjustment: 0 }];
    setVariants(newVariants);
    
    // Ajustar maxSelections si es necesario
    const validVariants = newVariants.filter(v => v.name.trim()).length;
    if (maxSelections >= validVariants) {
      setMaxSelections(Math.max(1, validVariants - 1));
    }
  };

  const removeVariant = (id: string) => {
    if (variants.length > 1) {
      const newVariants = variants.filter(v => v.id !== id);
      setVariants(newVariants);
      
      // Ajustar maxSelections si es necesario
      const validVariants = newVariants.filter(v => v.name.trim()).length;
      if (maxSelections >= validVariants) {
        setMaxSelections(Math.max(1, validVariants - 1));
      }
    }
  };

  const updateVariant = (id: string, name: string) => {
    setVariants(variants.map(v => v.id === id ? { ...v, name } : v));
  };

  const updateVariantPrice = (id: string, priceAdjustment: number) => {
    setVariants(variants.map(v => v.id === id ? { ...v, priceAdjustment } : v));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validVariants = variants
      .filter(v => v.name.trim().length > 0)
      .map(v => ({
        name: v.name.trim(),
        priceAdjustment: v.priceAdjustment
      }));

    if (validVariants.length === 0) {
      alert('Debes agregar al menos una variante');
      return;
    }

    if (!selectionText.trim()) {
      alert('Debes especificar el texto de selección');
      return;
    }

    // Validar que maxSelections sea menor al número de variantes
    if (maxSelections >= validVariants.length) {
      alert(`El máximo de selecciones (${maxSelections}) debe ser menor al número de variantes (${validVariants.length}). Si quieres que se seleccionen todas las variantes, mejor crea un platillo individual.`);
      return;
    }

    if (maxSelections <= 0) {
      alert('El máximo de selecciones debe ser mayor a 0');
      return;
    }

    onSubmit(validVariants, selectionText.trim(), maxSelections);
  };

  // Si no hay dish, mostrar mensaje de error
  if (!dish) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Error</h3>
          <p className="text-red-600">No se pudo cargar la información del platillo</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header del modal */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Agregar Variantes</h3>
        <p className="text-gray-600">{dish.name} - ${dish.price}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Texto de selección personalizable */}
        <div className="space-y-2">
          <label htmlFor="selectionText" className="block text-sm font-semibold text-gray-900">
            Texto de Selección *
          </label>
          <Input
            id="selectionText"
            type="text"
            value={selectionText}
            onChange={(e) => setSelectionText(e.target.value)}
            placeholder="Ej: Escoja el cocido de la carne, Escoja una gaseosa, Escoja dos toppings..."
            className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors duration-200"
            required
          />
        </div>

        {/* Variantes dinámicas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-semibold text-gray-900">
              Variantes *
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
              className="flex items-center space-x-2 px-4 py-2 border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar</span>
            </Button>
          </div>
          
          <div className="space-y-3">
            {variants.map((variant, index) => (
              <div key={variant.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Input
                      type="text"
                      value={variant.name}
                      onChange={(e) => updateVariant(variant.id, e.target.value)}
                      placeholder={`Variante ${index + 1} (ej: ${index === 0 ? 'Fanta' : index === 1 ? 'Coca Cola' : 'Sprite'})`}
                      className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Ajuste:</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-sm">$</span>
                      </div>
                      <Input
                        type="number"
                        value={variant.priceAdjustment}
                        onChange={(e) => updateVariantPrice(variant.id, parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 pl-7 text-center border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        min="-50"
                        max="50"
                        step="0.50"
                      />
                    </div>
                  </div>
                  {variants.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(variant.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors duration-200"
                      title="Eliminar variante"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
        </div>

        {/* Límite de selecciones */}
        <div className="space-y-2">
          <label htmlFor="maxSelections" className="block text-sm font-semibold text-gray-900">
            Máximo de Variantes a Seleccionar *
          </label>
          <Input
            id="maxSelections"
            type="number"
            min="1"
            max={Math.max(1, variants.filter(v => v.name.trim()).length - 1)}
            value={maxSelections}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              const validVariants = variants.filter(v => v.name.trim()).length;
              const maxAllowed = Math.max(1, validVariants - 1);
              
              if (value > maxAllowed) {
                setMaxSelections(maxAllowed);
              } else if (value <= 0) {
                setMaxSelections(1);
              } else {
                setMaxSelections(value);
              }
            }}
            className="w-32 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

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
            disabled={loading} 
            loading={loading}
            className="flex-1 sm:flex-none px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            Crear Variantes
          </Button>
        </div>
      </form>
    </div>
  );
}
