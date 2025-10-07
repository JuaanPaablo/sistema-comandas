'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Building2,
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  Calculator,
  AlertTriangle,
  CheckCircle,
  X,
  Info,
  Shield,
  Globe,
  Clock
} from 'lucide-react';

interface ConfiguracionContable {
  empresa: {
    nombre: string;
    ruc: string;
    direccion: string;
    telefono: string;
    email: string;
  };
  fiscal: {
    regimen: string;
    periodo_fiscal: string;
    iva_rate: number;
    retencion_rate: number;
  };
  contable: {
    moneda_base: string;
    formato_fecha: string;
    formato_numero: string;
    decimales: number;
  };
  facturacion: {
    serie_factura: string;
    serie_nota_credito: string;
    serie_nota_debito: string;
    autorizacion_sri: string;
  };
  reportes: {
    formato_reporte: string;
    incluir_logo: boolean;
    mostrar_detalles: boolean;
  };
}

export default function ConfiguracionContableModule() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [configuracion, setConfiguracion] = useState<ConfiguracionContable>({
    empresa: {
      nombre: '',
      ruc: '',
      direccion: '',
      telefono: '',
      email: ''
    },
    fiscal: {
      regimen: 'Régimen General',
      periodo_fiscal: 'Enero - Diciembre',
      iva_rate: 12.0,
      retencion_rate: 1.0
    },
    contable: {
      moneda_base: 'USD',
      formato_fecha: 'DD/MM/YYYY',
      formato_numero: '1,234.56',
      decimales: 2
    },
    facturacion: {
      serie_factura: '001-001',
      serie_nota_credito: '001-002',
      serie_nota_debito: '001-003',
      autorizacion_sri: ''
    },
    reportes: {
      formato_reporte: 'PDF',
      incluir_logo: true,
      mostrar_detalles: true
    }
  });

  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [showFiscalModal, setShowFiscalModal] = useState(false);
  const [showContableModal, setShowContableModal] = useState(false);
  const [showFacturacionModal, setShowFacturacionModal] = useState(false);
  const [showReportesModal, setShowReportesModal] = useState(false);

  const loadConfiguracion = async () => {
    try {
      setIsLoading(true);
      
      // Simular carga de configuración
      const mockConfig: ConfiguracionContable = {
        empresa: {
          nombre: 'Restaurante El Buen Sabor',
          ruc: '1234567890001',
          direccion: 'Av. Principal 123, Quito, Ecuador',
          telefono: '+593 2 234 5678',
          email: 'info@elbuensabor.com'
        },
        fiscal: {
          regimen: 'Régimen General',
          periodo_fiscal: 'Enero - Diciembre',
          iva_rate: 12.0,
          retencion_rate: 1.0
        },
        contable: {
          moneda_base: 'USD',
          formato_fecha: 'DD/MM/YYYY',
          formato_numero: '1,234.56',
          decimales: 2
        },
        facturacion: {
          serie_factura: '001-001',
          serie_nota_credito: '001-002',
          serie_nota_debito: '001-003',
          autorizacion_sri: '1234567890'
        },
        reportes: {
          formato_reporte: 'PDF',
          incluir_logo: true,
          mostrar_detalles: true
        }
      };
      
      setConfiguracion(mockConfig);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      
      // Simular guardado
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Configuración guardada exitosamente');
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error guardando la configuración');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  useEffect(() => {
    loadConfiguracion();
  }, []);

  const ConfiguracionCard = ({ 
    title, 
    description, 
    icon: Icon, 
    onClick, 
    color 
  }: { 
    title: string; 
    description: string; 
    icon: any; 
    onClick: () => void; 
    color: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600'
    };

    return (
      <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={onClick}>
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <Button variant="outline" size="sm" className="text-gray-600 border-gray-300 hover:bg-gray-50">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  };

  const ConfiguracionModal = ({ 
    isOpen, 
    onClose, 
    title, 
    children 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    children: React.ReactNode;
  }) => {
    if (!isOpen) return null;

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Settings className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                  <p className="text-sm text-gray-600">Configura los parámetros del sistema</p>
                </div>
              </div>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div className="px-8 py-6 max-h-[60vh] overflow-y-auto">
            {children}
          </div>

          <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-end space-x-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-3 bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="px-12 py-8 mb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">⚙️ Configuración Contable</h1>
            <p className="text-gray-600 mt-2">Parámetros fiscales, contables y de facturación</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={loadConfiguracion}
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Actualizar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-12 px-6 bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Guardar Todo
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto"></div>
          <p className="text-gray-900 mt-4 text-lg">Cargando configuración...</p>
        </div>
      ) : (
        <>
          {/* Tarjetas de Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <ConfiguracionCard
              title="Datos de la Empresa"
              description="Información fiscal y comercial"
              icon={Building2}
              onClick={() => setShowEmpresaModal(true)}
              color="blue"
            />
            <ConfiguracionCard
              title="Configuración Fiscal"
              description="Impuestos y régimen tributario"
              icon={Shield}
              onClick={() => setShowFiscalModal(true)}
              color="green"
            />
            <ConfiguracionCard
              title="Parámetros Contables"
              description="Moneda, formato y decimales"
              icon={Calculator}
              onClick={() => setShowContableModal(true)}
              color="purple"
            />
            <ConfiguracionCard
              title="Facturación Electrónica"
              description="Series y autorización SRI"
              icon={FileText}
              onClick={() => setShowFacturacionModal(true)}
              color="orange"
            />
            <ConfiguracionCard
              title="Configuración de Reportes"
              description="Formato y presentación"
              icon={CreditCard}
              onClick={() => setShowReportesModal(true)}
              color="red"
            />
          </div>

          {/* Resumen de Configuración */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="w-5 h-5 mr-2 text-blue-600" />
                  Resumen de Configuración
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Empresa:</span>
                    <span className="text-sm font-medium text-gray-900">{configuracion.empresa.nombre}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">RUC:</span>
                    <span className="text-sm font-medium text-gray-900">{configuracion.empresa.ruc}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Régimen:</span>
                    <span className="text-sm font-medium text-gray-900">{configuracion.fiscal.regimen}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">IVA:</span>
                    <span className="text-sm font-medium text-gray-900">{configuracion.fiscal.iva_rate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Moneda:</span>
                    <span className="text-sm font-medium text-gray-900">{configuracion.contable.moneda_base}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Estado del Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Configuración completa</p>
                      <p className="text-xs text-green-600">Todos los parámetros están configurados</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Última actualización</p>
                      <p className="text-xs text-blue-600">Hace 2 horas</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-purple-800">Cumplimiento fiscal</p>
                      <p className="text-xs text-purple-600">Configuración actualizada con SRI</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Modales de Configuración */}
          <ConfiguracionModal
            isOpen={showEmpresaModal}
            onClose={() => setShowEmpresaModal(false)}
            title="Datos de la Empresa"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-3">
                  <Building2 className="w-4 h-4 inline mr-2 text-blue-600" />
                  Nombre de la Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={configuracion.empresa.nombre}
                  onChange={(e) => setConfiguracion(prev => ({
                    ...prev,
                    empresa: { ...prev.empresa, nombre: e.target.value }
                  }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Nombre de la empresa"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-3">
                    <FileText className="w-4 h-4 inline mr-2 text-blue-600" />
                    RUC <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={configuracion.empresa.ruc}
                    onChange={(e) => setConfiguracion(prev => ({
                      ...prev,
                      empresa: { ...prev.empresa, ruc: e.target.value }
                    }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="1234567890001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-3">
                    <Globe className="w-4 h-4 inline mr-2 text-blue-600" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={configuracion.empresa.telefono}
                    onChange={(e) => setConfiguracion(prev => ({
                      ...prev,
                      empresa: { ...prev.empresa, telefono: e.target.value }
                    }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                    placeholder="+593 2 234 5678"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-3">
                  <Building2 className="w-4 h-4 inline mr-2 text-blue-600" />
                  Dirección
                </label>
                <input
                  type="text"
                  value={configuracion.empresa.direccion}
                  onChange={(e) => setConfiguracion(prev => ({
                    ...prev,
                    empresa: { ...prev.empresa, direccion: e.target.value }
                  }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Dirección completa"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-3">
                  <Globe className="w-4 h-4 inline mr-2 text-blue-600" />
                  Email
                </label>
                <input
                  type="email"
                  value={configuracion.empresa.email}
                  onChange={(e) => setConfiguracion(prev => ({
                    ...prev,
                    empresa: { ...prev.empresa, email: e.target.value }
                  }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="info@empresa.com"
                />
              </div>
            </div>
          </ConfiguracionModal>

          <ConfiguracionModal
            isOpen={showFiscalModal}
            onClose={() => setShowFiscalModal(false)}
            title="Configuración Fiscal"
          >
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-3">
                  <Shield className="w-4 h-4 inline mr-2 text-green-600" />
                  Régimen Tributario
                </label>
                <select
                  value={configuracion.fiscal.regimen}
                  onChange={(e) => setConfiguracion(prev => ({
                    ...prev,
                    fiscal: { ...prev.fiscal, regimen: e.target.value }
                  }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                >
                  <option value="Régimen General">Régimen General</option>
                  <option value="Régimen Simplificado">Régimen Simplificado</option>
                  <option value="Régimen Especial">Régimen Especial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-800 mb-3">
                  <Calendar className="w-4 h-4 inline mr-2 text-green-600" />
                  Período Fiscal
                </label>
                <select
                  value={configuracion.fiscal.periodo_fiscal}
                  onChange={(e) => setConfiguracion(prev => ({
                    ...prev,
                    fiscal: { ...prev.fiscal, periodo_fiscal: e.target.value }
                  }))}
                  className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                >
                  <option value="Enero - Diciembre">Enero - Diciembre</option>
                  <option value="Julio - Junio">Julio - Junio</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-3">
                    <DollarSign className="w-4 h-4 inline mr-2 text-green-600" />
                    Tasa de IVA (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={configuracion.fiscal.iva_rate}
                    onChange={(e) => setConfiguracion(prev => ({
                      ...prev,
                      fiscal: { ...prev.fiscal, iva_rate: parseFloat(e.target.value) }
                    }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                    placeholder="12.0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-3">
                    <Calculator className="w-4 h-4 inline mr-2 text-green-600" />
                    Tasa de Retención (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={configuracion.fiscal.retencion_rate}
                    onChange={(e) => setConfiguracion(prev => ({
                      ...prev,
                      fiscal: { ...prev.fiscal, retencion_rate: parseFloat(e.target.value) }
                    }))}
                    className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
                    placeholder="1.0"
                  />
                </div>
              </div>
            </div>
          </ConfiguracionModal>

          {/* Otros modales similares... */}
        </>
      )}
    </div>
  );
}

