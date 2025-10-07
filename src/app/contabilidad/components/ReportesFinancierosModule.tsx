'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  PieChart,
  LineChart,
  FileText,
  Calculator,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface ReporteData {
  periodo: string;
  ingresos: number;
  egresos: number;
  utilidad: number;
  margen: number;
}

interface KPI {
  nombre: string;
  valor: number;
  cambio: number;
  icono: any;
  color: string;
  unidad: string;
}

export default function ReportesFinancierosModule() {
  const [isLoading, setIsLoading] = useState(true);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState('mes');
  const [reporteData, setReporteData] = useState<ReporteData[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);

  const loadReportes = async () => {
    try {
      setIsLoading(true);
      
      // Simular carga de datos
      const mockData: ReporteData[] = [
        {
          periodo: 'Enero 2024',
          ingresos: 15000.00,
          egresos: 12000.00,
          utilidad: 3000.00,
          margen: 20.0
        },
        {
          periodo: 'Febrero 2024',
          ingresos: 18000.00,
          egresos: 14000.00,
          utilidad: 4000.00,
          margen: 22.2
        },
        {
          periodo: 'Marzo 2024',
          ingresos: 22000.00,
          egresos: 16000.00,
          utilidad: 6000.00,
          margen: 27.3
        }
      ];

      const mockKpis: KPI[] = [
        {
          nombre: 'Ingresos Totales',
          valor: 55000.00,
          cambio: 12.5,
          icono: TrendingUp,
          color: 'green',
          unidad: 'USD'
        },
        {
          nombre: 'Egresos Totales',
          valor: 42000.00,
          cambio: 8.3,
          icono: TrendingDown,
          color: 'red',
          unidad: 'USD'
        },
        {
          nombre: 'Utilidad Neta',
          valor: 13000.00,
          cambio: 18.7,
          icono: DollarSign,
          color: 'blue',
          unidad: 'USD'
        },
        {
          nombre: 'Margen de Utilidad',
          valor: 23.6,
          cambio: 2.1,
          icono: Target,
          color: 'purple',
          unidad: '%'
        }
      ];
      
      setReporteData(mockData);
      setKpis(mockKpis);
    } catch (error) {
      console.error('Error cargando reportes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportes();
  }, [periodoSeleccionado]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'green': return 'text-green-600 bg-green-100';
      case 'red': return 'text-red-600 bg-red-100';
      case 'blue': return 'text-blue-600 bg-blue-100';
      case 'purple': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getChangeColor = (cambio: number) => {
    return cambio >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getChangeIcon = (cambio: number) => {
    return cambio >= 0 ? TrendingUp : TrendingDown;
  };

  return (
    <div className="px-12 py-8 mb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📊 Reportes Financieros</h1>
            <p className="text-gray-600 mt-2">Análisis de rentabilidad y métricas clave</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className="h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="semana">Esta Semana</option>
              <option value="mes">Este Mes</option>
              <option value="trimestre">Este Trimestre</option>
              <option value="año">Este Año</option>
            </select>
            <Button
              onClick={loadReportes}
              className="h-12 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Actualizar
            </Button>
            <Button
              className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="text-gray-900 mt-4 text-lg">Generando reportes...</p>
        </div>
      ) : (
        <>
          {/* KPIs Principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {kpis.map((kpi, index) => {
              const IconComponent = kpi.icono;
              const ChangeIcon = getChangeIcon(kpi.cambio);
              
              return (
                <Card key={index} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`p-3 rounded-lg ${getColorClass(kpi.color)}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">{kpi.nombre}</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {kpi.unidad === 'USD' ? formatCurrency(kpi.valor) : `${kpi.valor.toFixed(1)}${kpi.unidad}`}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center text-sm ${getChangeColor(kpi.cambio)}`}>
                      <ChangeIcon className="w-4 h-4 mr-1" />
                      <span>{Math.abs(kpi.cambio).toFixed(1)}%</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Gráficos y Tablas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico de Ingresos vs Egresos */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-orange-600" />
                  Ingresos vs Egresos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reporteData.map((data, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{data.periodo}</span>
                        <span className="text-gray-600">
                          Utilidad: {formatCurrency(data.utilidad)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-green-600">Ingresos</span>
                          <span>{formatCurrency(data.ingresos)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${(data.ingresos / Math.max(...reporteData.map(d => d.ingresos))) * 100}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-red-600">Egresos</span>
                          <span>{formatCurrency(data.egresos)}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${(data.egresos / Math.max(...reporteData.map(d => d.ingresos))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Margen de Utilidad */}
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2 text-orange-600" />
                  Margen de Utilidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reporteData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{data.periodo}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${data.margen >= 20 ? 'bg-green-500' : data.margen >= 15 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.min(data.margen * 2, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-bold ${data.margen >= 20 ? 'text-green-600' : data.margen >= 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {formatPercentage(data.margen)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabla de Resumen */}
          <Card className="p-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-orange-600" />
                Resumen por Período
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Período
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ingresos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Egresos
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Utilidad
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Margen
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reporteData.map((data, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {data.periodo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                          {formatCurrency(data.ingresos)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                          {formatCurrency(data.egresos)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                          {formatCurrency(data.utilidad)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            data.margen >= 20 ? 'bg-green-100 text-green-800' : 
                            data.margen >= 15 ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {formatPercentage(data.margen)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {data.margen >= 20 ? (
                              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                            ) : data.margen >= 15 ? (
                              <Clock className="w-4 h-4 text-yellow-600 mr-1" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-red-600 mr-1" />
                            )}
                            <span className={`text-xs font-medium ${
                              data.margen >= 20 ? 'text-green-600' : 
                              data.margen >= 15 ? 'text-yellow-600' : 
                              'text-red-600'
                            }`}>
                              {data.margen >= 20 ? 'Excelente' : 
                               data.margen >= 15 ? 'Bueno' : 
                               'Necesita Mejora'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Alertas y Recomendaciones */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                  Alertas Financieras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Margen bajo detectado</p>
                      <p className="text-xs text-yellow-600">Algunos períodos muestran márgenes por debajo del 15%</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Target className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Oportunidad de crecimiento</p>
                      <p className="text-xs text-blue-600">Los ingresos han aumentado consistentemente</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="p-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="w-5 h-5 mr-2 text-green-600" />
                  Recomendaciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Optimizar costos</p>
                      <p className="text-xs text-green-600">Revisar gastos operativos para mejorar el margen</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-800">Aumentar precios</p>
                      <p className="text-xs text-purple-600">Considerar ajustes de precios en productos de alto margen</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
