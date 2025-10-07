'use client';

import { useState } from 'react';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  BarChart3, 
  Receipt, 
  Users, 
  Building2, 
  Settings,
  Clock,
  CreditCard,
  Smartphone,
  PiggyBank,
  FileSpreadsheet
} from 'lucide-react';
import ContabilidadNavigation from './components/ContabilidadNavigation';
import CajaManagementModule from './components/CajaManagementModule';
import IngresosModule from './components/IngresosModule';
import EgresosModule from './components/EgresosModule';
import FacturacionModule from './components/FacturacionModule';
import ReportesFinancierosModule from './components/ReportesFinancierosModule';
import TicketsModule from './components/TicketsModule';
import EmpleadosContabilidadModule from './components/EmpleadosContabilidadModule';
import ProveedoresModule from './components/ProveedoresModule';
import DashboardContableModule from './components/DashboardContableModule';
import ConfiguracionContableModule from './components/ConfiguracionContableModule';

interface ContabilidadModule {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'teal' | 'yellow' | 'pink' | 'indigo' | 'gray';
  component: any;
}

const contabilidadModules: ContabilidadModule[] = [
  {
    id: 'caja-management',
    title: 'Gestión de Caja (Contabilidad)',
    description: 'Arqueos, conciliación y cierre contable',
    icon: Calculator,
    color: 'blue',
    component: CajaManagementModule
  },
  {
    id: 'ingresos',
    title: 'Ingresos',
    description: 'Ventas y métodos de pago',
    icon: TrendingUp,
    color: 'green',
    component: IngresosModule
  },
  {
    id: 'egresos',
    title: 'Egresos',
    description: 'Gastos y compras',
    icon: TrendingDown,
    color: 'red',
    component: EgresosModule
  },
  {
    id: 'facturacion',
    title: 'Facturación',
    description: 'Facturas y notas de crédito',
    icon: FileText,
    color: 'purple',
    component: FacturacionModule
  },
  {
    id: 'reportes-financieros',
    title: 'Reportes Financieros',
    description: 'P&L y análisis de costos',
    icon: BarChart3,
    color: 'orange',
    component: ReportesFinancierosModule
  },
  {
    id: 'tickets',
    title: 'Tickets y Comprobantes',
    description: 'Impresión y documentación',
    icon: Receipt,
    color: 'teal',
    component: TicketsModule
  },
  {
    id: 'empleados-contabilidad',
    title: 'Empleados (Contabilidad)',
    description: 'Nómina, comisiones y liquidaciones',
    icon: Users,
    color: 'yellow',
    component: EmpleadosContabilidadModule
  },
  {
    id: 'proveedores',
    title: 'Proveedores',
    description: 'Compras y cuentas por pagar',
    icon: Building2,
    color: 'pink',
    component: ProveedoresModule
  },
  {
    id: 'dashboard-contable',
    title: 'Dashboard Contable',
    description: 'KPIs y métricas clave',
    icon: FileSpreadsheet,
    color: 'indigo',
    component: DashboardContableModule
  },
  {
    id: 'configuracion-contable',
    title: 'Configuración Contable',
    description: 'Parámetros fiscales y contables',
    icon: Settings,
    color: 'gray',
    component: ConfiguracionContableModule
  }
];

export default function ContabilidadPage() {
  const [activeModule, setActiveModule] = useState('caja-management');

  const handleModuleChange = (moduleId: string) => {
    setActiveModule(moduleId);
  };

  const currentModule = contabilidadModules.find(module => module.id === activeModule);
  const CurrentComponent = currentModule?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navegación superior */}
      <ContabilidadNavigation
        activeModule={activeModule}
        onModuleChange={handleModuleChange}
        modules={contabilidadModules}
      />

      {/* Contenido del módulo activo */}
      {CurrentComponent ? (
        <CurrentComponent />
      ) : (
        <div className="px-12 py-8 mb-12">
          <div className="text-center py-16">
            <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
              <DollarSign className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Módulo en Desarrollo
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Este submódulo está siendo desarrollado y estará disponible próximamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
