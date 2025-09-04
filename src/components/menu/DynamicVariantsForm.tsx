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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Banner informativo */}
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-700">
          <strong>Agregando variantes para:</strong> {dish.name}
        </p>
        <p className="text-xs text-green-600 mt-1">
          Precio base: ${dish.price} (todas las variantes tendrán el mismo precio)
        </p>
      </div>

      {/* Texto de selección personalizable */}
      <div>
        <label htmlFor="selectionText" className="block text-sm font-medium text-gray-700 mb-2">
          Texto de Selección *
        </label>
        <Input
          id="selectionText"
          type="text"
          value={selectionText}
          onChange={(e) => setSelectionText(e.target.value)}
          placeholder="Ej: Escoja el cocido de la carne, Escoja una gaseosa, Escoja dos toppings..."
          className="w-full"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Este texto aparecerá en la app de meseros cuando seleccionen este platillo
        </p>
      </div>

      {/* Variantes dinámicas */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Variantes *
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariant}
            className="flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar</span>
          </Button>
        </div>
        
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.id} className="flex items-center space-x-3">
              <Input
                type="text"
                value={variant.name}
                onChange={(e) => updateVariant(variant.id, e.target.value)}
                placeholder={`Variante ${index + 1} (ej: ${index === 0 ? 'Fanta' : index === 1 ? 'Coca Cola' : 'Sprite'})`}
                className="flex-1"
                required
              />
              <div className="flex items-center space-x-2">
                <label className="text-xs text-gray-900 whitespace-nowrap">Ajuste:</label>
                <Input
                  type="number"
                  value={variant.priceAdjustment}
                  onChange={(e) => updateVariantPrice(variant.id, parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-20 text-center"
                  min="-50"
                  max="50"
                  step="0.50"
                />
                <span className="text-xs text-gray-500">$</span>
              </div>
              {variants.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariant(variant.id)}
                  className="text-red-600 hover:text-red-900"
                  title="Eliminar variante"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        
        <p className="mt-2 text-sm text-gray-500">
          Ejemplo: Para "Escoja dos toppings" podrías agregar: Queso, Jamón, Tocino, Champiñones
        </p>
        <p className="mt-1 text-xs text-blue-600">
          💡 <strong>Ajuste de Precio:</strong> Si una variante cuesta más o menos que el precio base, 
          usa números positivos (+) para aumentar o negativos (-) para disminuir. 
          Ej: +2 = $7, -1 = $4 (precio base: $5)
        </p>
      </div>

      {/* Límite de selecciones */}
      <div>
        <label htmlFor="maxSelections" className="block text-sm font-medium text-gray-700 mb-2">
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
          className="w-32"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Cuántas variantes puede seleccionar un mesero (ej: 1 para "una gaseosa", 2 para "dos toppings")
        </p>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} loading={loading}>
          Crear Variantes
        </Button>
      </div>
    </form>
  );
}
