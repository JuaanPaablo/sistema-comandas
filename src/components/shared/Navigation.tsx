'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Utensils, 
  Package, 
  BookOpen, 
  Users,
  ShoppingCart,
  Settings,
  Shield,
  Monitor
} from 'lucide-react';

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Menú', href: '/menu', icon: Utensils },
  { name: 'Inventario', href: '/inventory', icon: Package },
  { name: 'Recetas', href: '/recetas', icon: BookOpen },
  { name: 'Cocina', href: '/cocina', icon: Monitor },
  { name: 'Empleados', href: '/empleados', icon: Users },
  { name: 'Caja', href: '/caja', icon: ShoppingCart },
  { name: 'Administración', href: '/admin', icon: Shield },
  { name: 'Configuración', href: '/configuracion', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-white shadow-lg border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">
          🍽️ COMANDAS
        </h1>
        
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
      
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600 text-center">
            Sistema COMANDAS v1.0
          </p>
        </div>
      </div>
    </nav>
  );
}
