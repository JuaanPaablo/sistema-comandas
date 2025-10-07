'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Building2,
  Package,
  Receipt
} from 'lucide-react';

interface KPIMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: any;
  color: string;
  format: 'currency' | 'percentage' | 'number';
  description: string;
}

interface ChartData {
  period: string;
  ingresos: number;
  egresos: number;
  utilidad: number;
}

export default function DashboardContableModule() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('mes');
  const [kpis, setKpis] = useState<KPIMetric[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Simular carga de KPIs
      const mockKpis: KPIMetric[] = [
        {
          id: '1',
          title: 'Ingresos Totales',
          value: 125000.00,
          change: 12.5,
          changeType: 'increase',
          icon: TrendingUp,
          color: 'green',
          format: 'currency',
          description: 'Ingresos del período actual'
        },
        {
          id: '2',
          title: 'Egresos Totales',
          value: 85000.00,
          change: 8.3,
          changeType: 'increase',
          icon: TrendingDown,
          color: 'red',
          format: 'currency',
          description: 'Gastos del período actual'
        },
        {
          id: '3',
          title: 'Utilidad Neta',
          value: 40000.00,
          change: 18.7,
          changeType: 'increase',
          icon: DollarSign,
          color: 'blue',
          format: 'currency',
          description: 'Ganancia neta del período'
        },
        {
          id: '4',
          title: 'Margen de Utilidad',
          value: 32.0,
          change: 2.1,
          changeType: 'increase',
          icon: Target,
          color: 'purple',
          format: 'percentage',
          description: 'Porcentaje de rentabilidad'
        },
        {
          id: '5',
          title: 'Clientes Activos',
          value: 245,
          change: 5.2,
          changeType: 'increase',
          icon: Users,
          color: 'indigo',
          format: 'number',
          description: 'Clientes con actividad reciente'
        },
        {
          id: '6',
          title: 'Proveedores Activos',
          value: 18,
          change: -2.1,
          changeType: 'decrease',
          icon: Building2,
          color: 'pink',
          format: 'number',
          description: 'Proveedores con compras recientes'
        }
      ];

      // Simular datos de gráficos
      const mockChartData: ChartData[] = [
        { period: 'Ene', ingresos: 15000, egresos: 12000, utilidad: 3000 },
        { period: 'Feb', ingresos: 18000, egresos: 14000, utilidad: 4000 },
        { period: 'Mar', ingresos: 22000, egresos: 16000, utilidad: 6000 },
        { period: 'Abr', ingresos: 25000, egresos: 18000, utilidad: 7000 },
        { period: 'May', ingresos: 28000, egresos: 20000, utilidad: 8000 },
        { period: 'Jun', ingresos: 32000, egresos: 22000, utilidad: 10000 }
      ];
      
      setKpis(mockKpis);
      setChartData(mockChartData);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('es-EC', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString('es-EC');
      default:
        return value.toString();
    }
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-100';
      case 'red': return 'text-red-600 bg-red-100';
      case 'blue': return 'text-blue-600 bg-blue-100';
      case 'purple': return 'text-purple-600 bg-purple-100';
      case 'indigo': return 'text-indigo-600 bg-indigo-100';
      case 'pink': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getChangeColor = (changeType: string) => {
    return changeType === 'increase' ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (changeType: string) => {
    return changeType === 'increase' ? TrendingUp : TrendingDown;
  };

  return (
    <div className="px-12 py-8 mb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Dashboard Contable</h1>
            <p className="text-gray-600 mt-2">Métricas clave y análisis financiero en tiempo real</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
              <option value="trimestre">Este Trimestre</option>
              <option value="año">Este Año</option>
            </select>
            <Button
              onClick={loadDashboardData}
              className="h-12 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-900 mt-4 text-lg">Cargando métricas...</p>
        </div>
      ) : (
        <>
          {/* KPIs Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {kpis.map((kpi) => {
              const IconComponent = kpi.icon;
              const ChangeIcon = getChangeIcon(kpi.changeType);
              
              return (
                <Card key={kpi.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg ${getColorClass(kpi.color)}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className={`flex items-center text-sm ${getChangeColor(kpi.changeType)}`}>
                      <ChangeIcon className="w-4 h-4 mr-1" />
                      <span>{Math.abs(kpi.change).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{kpi.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {formatValue(kpi.value, kpi.format)}
                    </p>
                    <p className="text-xs text-gray-500">{kpi.description}</p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Gráficos y Análisis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico de Ingresos vs Egresos */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                  Ingresos vs Egresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chartData.map((data, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{data.period}</span>
                        <span className="text-gray-600">
                          Utilidad: {formatValue(data.utilidad, 'currency')}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600">Ingresos</span>
                          <span>{formatValue(data.ingresos, 'currency')}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(data.ingresos / Math.max(...chartData.map(d => d.ingresos))) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-red-600">Egresos</span>
                          <span>{formatValue(data.egresos, 'currency')}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${(data.egresos / Math.max(...chartData.map(d => d.ingresos))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Distribución de Gastos */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-indigo-600" />
                  Distribución de Gastos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { category: 'Inventario', amount: 35000, color: 'bg-blue-500' },
                    { category: 'Personal', amount: 25000, color: 'bg-green-500' },
                    { category: 'Operativos', amount: 15000, color: 'bg-yellow-500' },
                    { category: 'Marketing', amount: 10000, color: 'bg-purple-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                        <span className="text-sm font-medium">{item.category}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${(item.amount / 85000) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {formatValue(item.amount, 'currency')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen Ejecutivo */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Fortalezas Financieras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Crecimiento consistente</p>
                      <p className="text-xs text-green-600">Los ingresos han aumentado 12.5% este mes</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Margen saludable</p>
                      <p className="text-xs text-blue-600">Margen de utilidad del 32% supera el objetivo</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-800">Base de clientes sólida</p>
                      <p className="text-xs text-purple-600">245 clientes activos con crecimiento del 5.2%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                  Áreas de Atención
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Reducción de proveedores</p>
                      <p className="text-xs text-yellow-600">Proveedores activos disminuyeron 2.1%</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <Package className="w-5 h-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Costo de inventario</p>
                      <p className="text-xs text-orange-600">Representa el 41% del total de gastos</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                    <Clock className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Optimización de procesos</p>
                      <p className="text-xs text-red-600">Revisar eficiencia operativa</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Acciones Recomendadas */}
          <Card className="p-6 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-indigo-600" />
                Acciones Recomendadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">📈 Optimizar Inventario</h4>
                  <p className="text-sm text-green-600 mb-3">Implementar sistema FIFO para reducir costos</p>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    Ver Detalles
                  </Button>
                </div>
                <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">👥 Expandir Cliente Base</h4>
                  <p className="text-sm text-blue-600 mb-3">Campaña de marketing para nuevos clientes</p>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Ver Detalles
                  </Button>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">⚡ Automatizar Procesos</h4>
                  <p className="text-sm text-purple-600 mb-3">Reducir tiempo en tareas administrativas</p>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

