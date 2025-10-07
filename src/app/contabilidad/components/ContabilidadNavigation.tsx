'use client';

import { useState } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  BarChart3, 
  Receipt, 
  Users, 
  Building2, 
  FileSpreadsheet, 
  Settings
} from 'lucide-react';

interface ContabilidadModule {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'teal' | 'yellow' | 'pink' | 'indigo' | 'gray';
  component: any;
}

interface ContabilidadNavigationProps {
  activeModule: string;
  onModuleChange: (moduleId: string) => void;
  modules: ContabilidadModule[];
}

export default function ContabilidadNavigation({ 
  activeModule, 
  onModuleChange, 
  modules 
}: ContabilidadNavigationProps) {
  const getIconColor = (color: string, isActive: boolean) => {
    if (isActive) {
      const colorMap = {
        blue: 'text-blue-600',
        green: 'text-green-600',
        red: 'text-red-600',
        purple: 'text-purple-600',
        orange: 'text-orange-600',
        teal: 'text-teal-600',
        yellow: 'text-yellow-600',
        pink: 'text-pink-600',
        indigo: 'text-indigo-600',
        gray: 'text-gray-600'
      };
      return colorMap[color as keyof typeof colorMap] || 'text-gray-600';
    }
    return 'text-gray-400';
  };

  const getTextColor = (isActive: boolean) => {
    return isActive ? 'text-gray-900' : 'text-gray-500';
  };

  const getBorderColor = (color: string, isActive: boolean) => {
    if (isActive) {
      const colorMap = {
        blue: 'border-blue-500',
        green: 'border-green-500',
        red: 'border-red-500',
        purple: 'border-purple-500',
        orange: 'border-orange-500',
        teal: 'border-teal-500',
        yellow: 'border-yellow-500',
        pink: 'border-pink-500',
        indigo: 'border-indigo-500',
        gray: 'border-gray-500'
      };
      return colorMap[color as keyof typeof colorMap] || 'border-gray-500';
    }
    return 'border-transparent';
  };

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-12 py-4">
        <div className="flex space-x-1 overflow-x-auto">
          {modules.map((module) => {
            const isActive = activeModule === module.id;
            const IconComponent = module.icon;
            
            return (
              <button
                key={module.id}
                onClick={() => onModuleChange(module.id)}
                className={`
                  flex items-center space-x-2 px-4 py-3 rounded-lg transition-all duration-200 whitespace-nowrap
                  ${isActive 
                    ? 'bg-gray-50 border-b-2' 
                    : 'hover:bg-gray-50 border-b-2 border-transparent'
                  }
                  ${getBorderColor(module.color, isActive)}
                `}
              >
                <IconComponent 
                  className={`w-5 h-5 ${getIconColor(module.color, isActive)}`} 
                />
                <span className={`text-sm font-medium ${getTextColor(isActive)}`}>
                  {module.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
