'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Volume2, VolumeX, Home } from 'lucide-react';

interface KDSHeaderProps {
  screenName: string;
  soundEnabled: boolean;
  onSoundToggle: () => void;
}

export const KDSHeader: React.FC<KDSHeaderProps> = ({
  screenName,
  soundEnabled,
  onSoundToggle
}) => {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };
    
    updateTime(); // Set initial time
    const interval = setInterval(updateTime, 1000);
    
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="bg-blue-600 text-white px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-4">
          <Link 
            href="/cocina"
            className="flex items-center gap-2 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Home className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold">{screenName}</h1>
              <p className="text-sm text-blue-100">Sistema de Visualización de Pedidos</p>
            </div>
          </div>
        </div>
        
        {/* Right Side */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-blue-700 px-3 py-2 rounded-lg">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-sm">{currentTime}</span>
          </div>
          
          <button
            onClick={onSoundToggle}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              soundEnabled 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-gray-500 hover:bg-gray-600'
            }`}
            title={soundEnabled ? 'Silenciar' : 'Activar sonido'}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
