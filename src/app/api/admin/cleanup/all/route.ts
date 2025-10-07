import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 Iniciando limpieza COMPLETA y AGRESIVA de la base de datos...');

    // Eliminar datos en orden correcto (de dependientes a independientes)
    const deleteOperations = [
      // Módulo de Caja y Facturación
      { table: 'invoice_items', description: 'Items de facturas' },
      { table: 'sri_logs', description: 'Logs del SRI' },
      { table: 'comanda_items', description: 'Items de comandas' },
      { table: 'comandas', description: 'Comandas' },
      
      // Módulo de Órdenes
      { table: 'order_items', description: 'Items de órdenes' },
      { table: 'orders', description: 'Órdenes' },
      
      // Módulo de Inventario
      { table: 'history_log', description: 'Registros de historial' },
      { table: 'stock_movements', description: 'Movimientos de stock' },
      { table: 'transfers', description: 'Transferencias' },
      { table: 'batches', description: 'Lotes' },
      { table: 'inventory_items', description: 'Productos de inventario' },
      { table: 'inventory_categories', description: 'Categorías de inventario' },
      { table: 'inventories', description: 'Inventarios' },
      
      // Módulo de Recetas
      { table: 'recipes', description: 'Recetas' },
      
      // Módulo de Menú
      { table: 'variants', description: 'Variantes' },
      { table: 'dishes', description: 'Platillos' },
      { table: 'categories', description: 'Categorías' },
      
      // Módulo de Cocina
      { table: 'screen_dish_assignments', description: 'Asignaciones de pantallas' },
      { table: 'kitchen_screens', description: 'Pantallas de cocina' },
      
      // Módulo de Empleados
      { table: 'employees', description: 'Empleados' },
      
      // Configuración Fiscal (eliminar todo)
      { table: 'invoice_sequences', description: 'Secuenciales de facturas' },
      { table: 'tax_configuration', description: 'Configuración de impuestos' },
      { table: 'company_fiscal_data', description: 'Datos fiscales de empresa' }
    ];

    const results = [];
    let totalDeleted = 0;
    
    for (const operation of deleteOperations) {
      try {
        console.log(`🗑️ Eliminando ${operation.description}...`);
        
        // Estrategia SÚPER SIMPLE: Select + Delete en lotes
        let deleted = 0;
        let lastError = null;

        try {
          // Paso 1: Obtener todos los IDs existentes
          const { data: allRecords, error: selectError } = await supabase
            .from(operation.table)
            .select('id');
          
          if (selectError) {
            console.log(`   ⚠️ Error al consultar ${operation.table}: ${selectError.message}`);
            lastError = selectError;
          } else if (allRecords && allRecords.length > 0) {
            console.log(`   📊 Encontrados ${allRecords.length} registros en ${operation.table}`);
            
            // Paso 2: Eliminar todos los registros encontrados
            const { data: deletedRecords, error: deleteError } = await supabase
              .from(operation.table)
              .delete()
              .in('id', allRecords.map(r => r.id))
              .select('id');
            
            if (deleteError) {
              console.log(`   ❌ Error al eliminar de ${operation.table}: ${deleteError.message}`);
              lastError = deleteError;
            } else {
              deleted = deletedRecords ? deletedRecords.length : 0;
              console.log(`   ✅ Eliminados ${deleted} registros de ${operation.table}`);
            }
          } else {
            console.log(`   ℹ️ Tabla ${operation.table} ya está vacía`);
          }
        } catch (err) {
          console.log(`   💥 Error inesperado en ${operation.table}:`, err);
          lastError = err;
        }

        if (lastError && deleted === 0) {
          console.error(`❌ Error eliminando ${operation.table}:`, lastError);
          results.push({ 
            table: operation.table, 
            status: 'error', 
            message: lastError.message || 'Error desconocido',
            deleted: 0
          });
        } else {
          console.log(`✅ ${operation.description}: ${deleted} registros eliminados`);
          totalDeleted += deleted;
          results.push({ 
            table: operation.table, 
            status: 'success', 
            message: `${deleted} registros eliminados`,
            deleted
          });
        }
      } catch (err) {
        console.error(`💥 Error inesperado en ${operation.table}:`, err);
        results.push({ 
          table: operation.table, 
          status: 'error', 
          message: 'Error inesperado',
          deleted: 0
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`🎉 LIMPIEZA AGRESIVA COMPLETADA:`);
    console.log(`   - ${successCount} tablas procesadas exitosamente`);
    console.log(`   - ${errorCount} tablas con errores`);
    console.log(`   - ${totalDeleted} registros eliminados en total`);
    console.log(`   - Base de datos completamente vacía ✨`);

    return NextResponse.json({
      success: true,
      message: `🎉 LIMPIEZA COMPLETA: ${totalDeleted} registros eliminados de ${successCount} tablas. Base de datos completamente vacía.`,
      details: {
        successCount,
        errorCount,
        totalDeleted,
        results
      }
    });

  } catch (error) {
    console.error('❌ Error crítico durante la limpieza completa:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error crítico durante la limpieza de la base de datos',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
