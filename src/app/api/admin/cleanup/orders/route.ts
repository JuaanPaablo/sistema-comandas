import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    // Orden de eliminación para respetar las foreign keys de órdenes
    const tablesToClean = [
      'order_assignments',
      'order_commissions',
      'orders'
    ];

    const results = [];

    for (const table of tablesToClean) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) {
          console.warn(`Warning cleaning ${table}:`, error.message);
        } else {
          results.push(`${table}: ✅ Limpiado`);
        }
      } catch (tableError) {
        console.warn(`Error cleaning ${table}:`, tableError);
        results.push(`${table}: ⚠️ Error`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Datos de órdenes eliminados correctamente',
      details: results
    });

  } catch (error) {
    console.error('Error durante la limpieza de órdenes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error interno del servidor durante la limpieza de órdenes',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
