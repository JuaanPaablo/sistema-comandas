'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { CajaService } from '@/lib/services/cajaService';
import { Building2, Save, AlertCircle, CheckCircle } from 'lucide-react';

export default function ConfiguracionFiscalPage() {
  const [formData, setFormData] = useState({
    ruc: '',
    razon_social: '',
    nombre_comercial: '',
    direccion_matriz: '',
    direccion_establecimiento: '',
    codigo_establecimiento: '001',
    codigo_punto_emision: '001',
    telefono: '',
    email: '',
    ambiente: 'pruebas' as 'pruebas' | 'produccion',
    tipo_emision: 'normal' as 'normal' | 'indisponibilidad'
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadFiscalData();
  }, []);

  const loadFiscalData = async () => {
    try {
      setLoading(true);
      const { data, error } = await CajaService.getCompanyFiscalData();
      
      if (error) {
        console.error('Error cargando datos fiscales:', error);
        setMessage({ type: 'error', text: 'Error cargando datos fiscales' });
        return;
      }

      if (data) {
        setFormData({
          ruc: data.ruc || '',
          razon_social: data.razon_social || '',
          nombre_comercial: data.nombre_comercial || '',
          direccion_matriz: data.direccion_matriz || '',
          direccion_establecimiento: data.direccion_establecimiento || '',
          codigo_establecimiento: data.codigo_establecimiento || '001',
          codigo_punto_emision: data.codigo_punto_emision || '001',
          telefono: data.telefono || '',
          email: data.email || '',
          ambiente: data.ambiente || 'pruebas',
          tipo_emision: data.tipo_emision || 'normal'
        });
      }
    } catch (error) {
      console.error('Error cargando datos fiscales:', error);
      setMessage({ type: 'error', text: 'Error interno del servidor' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Validaciones básicas
      if (!formData.ruc || formData.ruc.length !== 13) {
        setMessage({ type: 'error', text: 'El RUC debe tener 13 dígitos' });
        return;
      }

      if (!formData.razon_social.trim()) {
        setMessage({ type: 'error', text: 'La razón social es obligatoria' });
        return;
      }

      if (!formData.direccion_matriz.trim()) {
        setMessage({ type: 'error', text: 'La dirección matriz es obligatoria' });
        return;
      }

      const { success, error } = await CajaService.saveCompanyFiscalData(formData);

      if (success) {
        setMessage({ type: 'success', text: 'Datos fiscales guardados correctamente' });
      } else {
        setMessage({ type: 'error', text: error || 'Error guardando datos fiscales' });
      }
    } catch (error) {
      console.error('Error guardando datos fiscales:', error);
      setMessage({ type: 'error', text: 'Error interno del servidor' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando configuración fiscal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Building2 className="h-8 w-8 mr-3 text-blue-600" />
            Configuración Fiscal
          </h1>
          <p className="text-gray-600 mt-2">
            Configure los datos fiscales de su empresa para la facturación electrónica
          </p>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 mr-2" />
            )}
            {message.text}
          </div>
        )}

        <Card className="p-8">
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            {/* Datos Básicos */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Datos Básicos de la Empresa</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RUC <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.ruc}
                    onChange={(e) => handleInputChange('ruc', e.target.value)}
                    placeholder="1234567890001"
                    maxLength={13}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Razón Social <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.razon_social}
                    onChange={(e) => handleInputChange('razon_social', e.target.value)}
                    placeholder="Nombre de la empresa"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Comercial
                  </label>
                  <Input
                    type="text"
                    value={formData.nombre_comercial}
                    onChange={(e) => handleInputChange('nombre_comercial', e.target.value)}
                    placeholder="Nombre comercial (opcional)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <Input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    placeholder="02-1234567"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="empresa@ejemplo.com"
                  />
                </div>
              </div>
            </div>

            {/* Direcciones */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Direcciones</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección Matriz <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={formData.direccion_matriz}
                    onChange={(e) => handleInputChange('direccion_matriz', e.target.value)}
                    placeholder="Dirección completa de la matriz"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección del Establecimiento
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={formData.direccion_establecimiento}
                    onChange={(e) => handleInputChange('direccion_establecimiento', e.target.value)}
                    placeholder="Dirección del establecimiento (opcional)"
                  />
                </div>
              </div>
            </div>

            {/* Configuración de Facturación */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Configuración de Facturación</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Establecimiento
                  </label>
                  <Input
                    type="text"
                    value={formData.codigo_establecimiento}
                    onChange={(e) => handleInputChange('codigo_establecimiento', e.target.value)}
                    placeholder="001"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Punto de Emisión
                  </label>
                  <Input
                    type="text"
                    value={formData.codigo_punto_emision}
                    onChange={(e) => handleInputChange('codigo_punto_emision', e.target.value)}
                    placeholder="001"
                    maxLength={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ambiente
                  </label>
                  <Select
                    value={formData.ambiente}
                    onChange={(e) => handleInputChange('ambiente', e.target.value)}
                  >
                    <option value="pruebas">Pruebas</option>
                    <option value="produccion">Producción</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Emisión
                  </label>
                  <Select
                    value={formData.tipo_emision}
                    onChange={(e) => handleInputChange('tipo_emision', e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="indisponibilidad">Indisponibilidad</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                onClick={loadFiscalData}
                className="bg-gray-600 hover:bg-gray-700 text-white"
                disabled={saving}
              >
                🔄 Recargar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Configuración
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">ℹ️ Información Importante</h3>
          <ul className="text-blue-800 space-y-2 text-sm">
            <li>• El RUC debe ser válido y estar registrado en el SRI</li>
            <li>• Use "Pruebas" para desarrollo y "Producción" para facturación real</li>
            <li>• Los códigos de establecimiento y punto de emisión deben coincidir con el SRI</li>
            <li>• La dirección matriz es obligatoria para la facturación electrónica</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
