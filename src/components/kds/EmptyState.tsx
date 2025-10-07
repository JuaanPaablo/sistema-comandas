'use client';

import React from 'react';
import { ChefHat, UtensilsCrossed } from 'lucide-react';

interface EmptyStateProps {
  type: 'loading' | 'error' | 'empty';
  message?: string;
  error?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, message, error }) => {
  if (type === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600">{error || 'Ocurrió un error al cargar los datos'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center">
        <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <ChefHat className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Sin pedidos</h3>
        <p className="text-gray-600">{message || 'No se encontraron órdenes para esta pantalla'}</p>
      </div>
    </div>
  );
};
