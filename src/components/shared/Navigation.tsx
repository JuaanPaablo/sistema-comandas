'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Home,
  Utensils,
  Package,
  BookOpen,
  Users,
  ShoppingCart,
  Settings,
  Shield,
  Monitor,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const navGroups: Array<{
  label: string;
  items: Array<{ name: string; href: string; icon: any; badge?: string }>; 
}> = [
  {
    label: 'Principal',
    items: [
      { name: 'Dashboard', href: '/', icon: Home },
      { name: 'Menú', href: '/menu', icon: Utensils },
      { name: 'Caja (Operaciones)', href: '/caja', icon: ShoppingCart }
    ]
  },
  {
    label: 'Operación',
    items: [
      { name: 'Inventario', href: '/inventory', icon: Package },
      { name: 'Recetas', href: '/recetas', icon: BookOpen },
      { name: 'Cocina', href: '/cocina', icon: Monitor }
    ]
  },
  {
    label: 'Finanzas',
    items: [
      { name: 'Contabilidad', href: '/contabilidad', icon: DollarSign }
    ]
  },
  {
    label: 'Administración',
    items: [
      { name: 'Empleados (Operaciones)', href: '/empleados', icon: Users },
      { name: 'Administración', href: '/admin', icon: Shield },
      { name: 'Configuración', href: '/configuracion', icon: Settings }
    ]
  }
];

export function Navigation() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <nav className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-r border-gray-200 flex flex-col h-screen transition-all duration-300 ease-in-out`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">🍽️ COMANDAS</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">v1.0</span>
            </>
          )}
          {isCollapsed && (
            <div className="flex justify-center w-full">
              <span className="text-2xl">🍽️</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {navGroups.map(({ label, items }) => (
            <div key={label}>
              {!isCollapsed && (
                <div className="px-4 mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
              )}
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group relative flex items-center ${isCollapsed ? 'px-3 py-2.5 justify-center' : 'px-4 py-2.5'} rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                        isActive
                          ? 'text-blue-700 bg-blue-50'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                      title={isCollapsed ? item.name : undefined}
                    >
                      {/* Indicador activo */}
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-md h-6 transition-colors ${isActive ? 'bg-blue-600' : 'bg-transparent group-hover:bg-gray-300'}`} />
                      <Icon className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'} ${isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'}`} />
                      {!isCollapsed && (
                        <>
                          <span className="font-medium text-sm flex-1">{item.name}</span>
                          {item.badge && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">{item.badge}</span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto p-4">
        {!isCollapsed && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-center">
            <p className="text-xs text-gray-600">Sistema COMANDAS</p>
            <p className="text-[10px] text-gray-400">Hecho con ❤️ para restaurantes</p>
          </div>
        )}
        
        {/* Botón para colapsar/expandir */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="mt-4 w-full flex items-center justify-center p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          title={isCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </nav>
  );
}
