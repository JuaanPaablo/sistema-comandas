'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CocinaPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir automáticamente a la cocina simplificada
    router.push('/cocina-simplificada');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirigiendo a la cocina simplificada...</p>
      </div>
    </div>
  );
}