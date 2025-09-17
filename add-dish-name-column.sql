-- Agregar columna dish_name a la tabla order_items
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar la columna dish_name
ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS dish_name VARCHAR;

-- 2. Actualizar los registros existentes con el nombre del platillo
UPDATE order_items 
SET dish_name = d.name
FROM dishes d 
WHERE order_items.menu_item_id = d.id 
AND order_items.dish_name IS NULL;

-- 3. Para registros que tienen variantes en notes, extraer el nombre de la variante
UPDATE order_items 
SET dish_name = SPLIT_PART(notes, ' | ', 2)
WHERE notes LIKE '% | %' 
AND dish_name IS NULL;

-- 4. Para registros que solo tienen el nombre en notes (sin |), usar ese nombre
UPDATE order_items 
SET dish_name = notes
WHERE notes IS NOT NULL 
AND notes NOT LIKE '% | %'
AND dish_name IS NULL;

-- 5. Verificar que la columna se agregó correctamente
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND column_name = 'dish_name';

-- 6. Ver algunos registros de ejemplo
SELECT 
  id,
  dish_name,
  notes,
  menu_item_id,
  quantity,
  status
FROM order_items 
ORDER BY created_at DESC
LIMIT 10;
