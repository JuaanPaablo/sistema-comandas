-- Test script para verificar datos de comandas
SELECT 
  'Comandas' as tabla,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
  COUNT(*) FILTER (WHERE status = 'ready') as listas,
  COUNT(*) FILTER (WHERE status = 'served') as servidas
FROM comandas
UNION ALL
SELECT 
  'Comanda Items' as tabla,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'pending') as pendientes,
  COUNT(*) FILTER (WHERE status = 'ready') as listas,
  COUNT(*) FILTER (WHERE status = 'served') as servidas
FROM comanda_items;

-- Ver comandas activas
SELECT 
  c.id,
  c.table_number,
  c.employee_name,
  c.status as comanda_status,
  c.total_amount,
  c.items_count,
  c.created_at
FROM comandas c
WHERE c.status IN ('pending', 'ready')
ORDER BY c.created_at DESC;

-- Ver items de comandas activas
SELECT 
  ci.id,
  ci.dish_name,
  ci.quantity,
  ci.status as item_status,
  c.table_number,
  c.employee_name,
  ci.created_at
FROM comanda_items ci
JOIN comandas c ON ci.comanda_id = c.id
WHERE ci.status IN ('pending', 'ready')
ORDER BY ci.created_at DESC;
