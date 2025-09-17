import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 Iniciando limpieza completa de la base de datos...');

    // Eliminar datos en orden correcto (de dependientes a independientes)
    const deleteOperations = [
      { table: 'history_log', description: 'Registros de historial' },
      { table: 'stock_movements', description: 'Movimientos de stock' },
      { table: 'transfers', description: 'Transferencias' },
      { table: 'batches', description: 'Lotes' },
      { table: 'recipes', description: 'Recetas' },
      { table: 'order_items', description: 'Items de órdenes' },
      { table: 'orders', description: 'Órdenes' },
      { table: 'screen_dish_assignments', description: 'Asignaciones de pantallas' },
      { table: 'kitchen_screens', description: 'Pantallas de cocina' },
      { table: 'inventory_items', description: 'Productos de inventario' },
      { table: 'inventory_categories', description: 'Categorías de inventario' },
      { table: 'inventories', description: 'Inventarios' },
      { table: 'variants', description: 'Variantes' },
      { table: 'dishes', description: 'Platillos' },
      { table: 'categories', description: 'Categorías' },
      { table: 'employees', description: 'Empleados' }
    ];

    const results = [];
    
    for (const operation of deleteOperations) {
      try {
        // Usar una consulta que siempre devuelva true para eliminar todos los registros
        const { error } = await supabase
          .from(operation.table)
          .delete()
          .gte('created_at', '1900-01-01'); // Fecha muy antigua para capturar todos

        if (error) {
          console.error(`Error eliminando ${operation.table}:`, error);
          results.push({ table: operation.table, status: 'error', message: error.message });
        } else {
          console.log(`✅ ${operation.description} eliminados`);
          results.push({ table: operation.table, status: 'success', message: 'Eliminado correctamente' });
        }
      } catch (err) {
        console.error(`Error inesperado en ${operation.table}:`, err);
        results.push({ table: operation.table, status: 'error', message: 'Error inesperado' });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`🎉 Limpieza completada: ${successCount} tablas limpiadas, ${errorCount} errores`);

    return NextResponse.json({
      success: true,
      message: `Limpieza completada: ${successCount} tablas limpiadas exitosamente`,
      details: {
        successCount,
        errorCount,
        results
      }
    });

  } catch (error) {
    console.error('❌ Error durante la limpieza completa:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error durante la limpieza de la base de datos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}