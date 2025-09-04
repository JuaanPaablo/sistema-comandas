import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const { table } = await params;
    
    // Lista de tablas permitidas para limpieza
    const allowedTables = [
      'categories',
      'dishes', 
      'variants',
      'inventories',
      'inventory_categories',
      'inventory_items',
      'batches',
      'stock_movements',
      'transfers'
    ];

    if (!allowedTables.includes(table)) {
      return Response.json(
        { error: `Tabla '${table}' no está permitida para limpieza` },
        { status: 400 }
      );
    }

    // Eliminar todos los registros de la tabla especificada
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Evitar eliminar registros del sistema

    if (error) {
      console.error(`Error limpiando tabla ${table}:`, error);
      return Response.json(
        { error: `Error limpiando tabla: ${error.message}` },
        { status: 500 }
      );
    }

    return Response.json(
      { message: `Tabla '${table}' limpiada exitosamente` },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en cleanup:', error);
    return Response.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
