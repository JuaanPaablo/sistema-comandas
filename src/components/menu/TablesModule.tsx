'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { supabase, supabaseAdmin } from '@/lib/supabase-admin';

interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  current_order_id?: string;
  created_at: string;
  updated_at: string;
}

interface TableFormData {
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
}

export const TablesModule: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deletingTable, setDeletingTable] = useState<Table | null>(null);
  const [formData, setFormData] = useState<TableFormData>({
    number: 1,
    capacity: 4,
    status: 'available'
  });

  // Cargar mesas
  const loadTables = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('number', { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar las mesas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTables();
  }, []);

  // Abrir modal para crear/editar mesa
  const openModal = (table?: Table) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        number: table.number,
        capacity: table.capacity,
        status: table.status
      });
    } else {
      setEditingTable(null);
      setFormData({
        number: Math.max(...tables.map(t => t.number), 0) + 1,
        capacity: 4,
        status: 'available'
      });
    }
    setShowModal(true);
  };

  // Guardar mesa
  const saveTable = async () => {
    try {
      // Usar cliente de administrador para operaciones de escritura
      const client = supabaseAdmin || supabase;
      
      if (editingTable) {
        // Actualizar mesa existente
        const { error } = await client
          .from('tables')
          .update({
            number: formData.number,
            capacity: formData.capacity,
            status: formData.status,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingTable.id);

        if (error) throw error;
      } else {
        // Crear nueva mesa
        const { error } = await client
          .from('tables')
          .insert({
            number: formData.number,
            capacity: formData.capacity,
            status: formData.status
          });

        if (error) throw error;
      }

      setShowModal(false);
      await loadTables();
    } catch (err) {
      console.error('Error saving table:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar la mesa');
    }
  };

  // Eliminar mesa
  const deleteTable = async () => {
    if (!deletingTable) return;

    try {
      // Usar cliente de administrador para operaciones de escritura
      const client = supabaseAdmin || supabase;
      
      const { error } = await client
        .from('tables')
        .delete()
        .eq('id', deletingTable.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setDeletingTable(null);
      await loadTables();
    } catch (err) {
      console.error('Error deleting table:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar la mesa');
    }
  };

  // Obtener color del estado
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'cleaning':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      case 'cleaning':
        return 'Limpieza';
      default:
        return status;
    }
  };

  // Obtener icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="w-4 h-4" />;
      case 'occupied':
        return <XCircle className="w-4 h-4" />;
      case 'reserved':
        return <Clock className="w-4 h-4" />;
      case 'cleaning':
        return <Users className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Cargando mesas...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Mesas</h2>
          <p className="text-gray-600">Administra las mesas del restaurante</p>
        </div>
        <Button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Mesa
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Grid de Mesas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <Card key={table.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-lg">Mesa {table.number}</h3>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openModal(table)}
                  className="p-1 h-8 w-8"
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDeletingTable(table);
                    setShowDeleteModal(true);
                  }}
                  className="p-1 h-8 w-8 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  Capacidad: {table.capacity} personas
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(table.status)}`}>
                  {getStatusIcon(table.status)}
                  {getStatusText(table.status)}
                </div>
              </div>

              {table.current_order_id && (
                <div className="text-xs text-gray-500">
                  Orden activa: {table.current_order_id.slice(-6)}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Modal para crear/editar mesa */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingTable ? 'Editar Mesa' : 'Nueva Mesa'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Mesa
            </label>
            <input
              type="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="available">Disponible</option>
              <option value="occupied">Ocupada</option>
              <option value="reserved">Reservada</option>
              <option value="cleaning">Limpieza</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={saveTable}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingTable ? 'Actualizar' : 'Crear'} Mesa
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteTable}
        title="Eliminar Mesa"
        message={`¿Estás seguro de que quieres eliminar la Mesa ${deletingTable?.number}?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};
