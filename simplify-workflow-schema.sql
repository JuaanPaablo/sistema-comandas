-- =====================================================
-- SCRIPT PARA SIMPLIFICAR FLUJO DE TRABAJO CON COMANDA
-- =====================================================

-- 1. SIMPLIFICAR ESTADOS EN comanda_items (de 4 a 3 estados)
ALTER TABLE comanda_items 
DROP CONSTRAINT IF EXISTS comanda_items_status_check;

ALTER TABLE comanda_items 
ADD CONSTRAINT comanda_items_status_check 
CHECK (status IN ('pending', 'ready', 'served'));

-- 2. SIMPLIFICAR ESTADOS EN comandas (de 5 a 3 estados)
ALTER TABLE comandas 
DROP CONSTRAINT IF EXISTS comandas_status_check;

ALTER TABLE comandas 
ADD CONSTRAINT comandas_status_check 
CHECK (status IN ('pending', 'ready', 'served'));

-- 3. AGREGAR CAMPOS PARA EL FLUJO SIMPLIFICADO
ALTER TABLE comandas 
ADD COLUMN IF NOT EXISTS total_preparation_time INTEGER DEFAULT 0;

ALTER TABLE comanda_items 
ADD COLUMN IF NOT EXISTS kitchen_notes TEXT;

ALTER TABLE comanda_items 
ADD COLUMN IF NOT EXISTS preparation_time INTEGER DEFAULT 0;

-- 4. CREAR FUNCIÓN PARA CREAR COMANDA AUTOMÁTICAMENTE
-- Primero eliminar la función existente si existe
DROP FUNCTION IF EXISTS create_comanda_from_order(UUID);

CREATE OR REPLACE FUNCTION create_comanda_from_order(order_uuid UUID)
RETURNS UUID AS $$
DECLARE
    comanda_id UUID;
    order_data RECORD;
    item_data RECORD;
    employee_name VARCHAR;
BEGIN
    -- Obtener datos de la orden
    SELECT * INTO order_data FROM orders WHERE id = order_uuid;
    
    -- Obtener nombre del empleado
    SELECT name INTO employee_name FROM employees WHERE id = order_data.employee_id;
    
    -- Crear comanda
    INSERT INTO comandas (
        order_id, 
        table_number, 
        employee_id, 
        employee_name, 
        status, 
        total_amount, 
        items_count,
        notes
    ) VALUES (
        order_uuid,
        EXTRACT(EPOCH FROM order_data.created_at)::INTEGER, -- Usar timestamp como mesa temporal
        order_data.employee_id,
        COALESCE(employee_name, 'Mesero'),
        'pending',
        order_data.total_amount,
        (SELECT COUNT(*) FROM order_items WHERE order_id = order_uuid),
        order_data.notes
    ) RETURNING id INTO comanda_id;
    
    -- Crear items de comanda
    FOR item_data IN 
        SELECT oi.*, d.name as dish_name 
        FROM order_items oi 
        JOIN dishes d ON oi.menu_item_id = d.id 
        WHERE oi.order_id = order_uuid
    LOOP
        INSERT INTO comanda_items (
            comanda_id,
            order_item_id,
            dish_id,
            dish_name,
            quantity,
            unit_price,
            total_price,
            status,
            notes
        ) VALUES (
            comanda_id,
            item_data.id,
            item_data.menu_item_id,
            item_data.dish_name,
            item_data.quantity,
            item_data.unit_price,
            item_data.total_price,
            'pending',
            item_data.notes
        );
    END LOOP;
    
    RETURN comanda_id;
END;
$$ LANGUAGE plpgsql;

-- 5. CREAR FUNCIÓN PARA ACTUALIZAR ESTADO DE COMANDA
-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS update_comanda_status();

CREATE OR REPLACE FUNCTION update_comanda_status()
RETURNS TRIGGER AS $$
DECLARE
    comanda_status VARCHAR;
    total_items INTEGER;
    ready_items INTEGER;
BEGIN
    -- Contar items por estado
    SELECT COUNT(*), COUNT(*) FILTER (WHERE status = 'ready')
    INTO total_items, ready_items
    FROM comanda_items 
    WHERE comanda_id = NEW.comanda_id;
    
    -- Determinar estado de la comanda
    IF ready_items = total_items AND total_items > 0 THEN
        comanda_status := 'ready';
    ELSE
        comanda_status := 'pending';
    END IF;
    
    -- Actualizar estado de la comanda
    UPDATE comandas 
    SET status = comanda_status, updated_at = NOW()
    WHERE id = NEW.comanda_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. CREAR TRIGGER PARA SINCRONIZACIÓN AUTOMÁTICA
DROP TRIGGER IF EXISTS update_comanda_status_trigger ON comanda_items;
CREATE TRIGGER update_comanda_status_trigger
    AFTER UPDATE ON comanda_items
    FOR EACH ROW
    EXECUTE FUNCTION update_comanda_status();

-- 7. CREAR FUNCIÓN PARA MARCAR COMANDA COMO LISTA
-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS mark_comanda_ready(UUID);

CREATE OR REPLACE FUNCTION mark_comanda_ready(comanda_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Marcar todos los items como listos
    UPDATE comanda_items 
    SET status = 'ready', prepared_at = NOW()
    WHERE comanda_id = comanda_uuid AND status = 'pending';
    
    -- El trigger se encargará de actualizar el estado de la comanda
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 8. CREAR FUNCIÓN PARA MARCAR COMANDA COMO SERVIDA
-- Eliminar función existente si existe
DROP FUNCTION IF EXISTS mark_comanda_served(UUID);

CREATE OR REPLACE FUNCTION mark_comanda_served(comanda_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Marcar todos los items como servidos
    UPDATE comanda_items 
    SET status = 'served', served_at = NOW()
    WHERE comanda_id = comanda_uuid AND status = 'ready';
    
    -- Marcar comanda como servida
    UPDATE comandas 
    SET status = 'served', served_at = NOW(), updated_at = NOW()
    WHERE id = comanda_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 9. CREAR VISTA PARA COMANDA COMPLETA
-- Eliminar vista existente si existe
DROP VIEW IF EXISTS comanda_complete;

CREATE OR REPLACE VIEW comanda_complete AS
SELECT 
    c.id,
    c.order_id,
    c.table_number,
    c.employee_name,
    c.status,
    c.total_amount,
    c.items_count,
    c.created_at,
    c.updated_at,
    c.served_at,
    c.notes,
    c.priority,
    c.estimated_time,
    c.actual_time,
    c.total_preparation_time,
    -- Items de la comanda
    COALESCE(
        json_agg(
            json_build_object(
                'id', ci.id,
                'dish_name', ci.dish_name,
                'quantity', ci.quantity,
                'unit_price', ci.unit_price,
                'total_price', ci.total_price,
                'status', ci.status,
                'prepared_at', ci.prepared_at,
                'served_at', ci.served_at,
                'notes', ci.notes,
                'priority', ci.priority,
                'preparation_time', ci.preparation_time,
                'kitchen_notes', ci.kitchen_notes
            )
        ) FILTER (WHERE ci.id IS NOT NULL),
        '[]'::json
    ) as items
FROM comandas c
LEFT JOIN comanda_items ci ON c.id = ci.comanda_id
GROUP BY c.id, c.order_id, c.table_number, c.employee_name, c.status, 
         c.total_amount, c.items_count, c.created_at, c.updated_at, 
         c.served_at, c.notes, c.priority, c.estimated_time, c.actual_time, 
         c.total_preparation_time;

-- 10. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_comandas_status ON comandas(status);
CREATE INDEX IF NOT EXISTS idx_comandas_created_at ON comandas(created_at);
CREATE INDEX IF NOT EXISTS idx_comanda_items_status ON comanda_items(status);
CREATE INDEX IF NOT EXISTS idx_comanda_items_comanda_id ON comanda_items(comanda_id);
CREATE INDEX IF NOT EXISTS idx_comanda_items_screen_id ON comanda_items(screen_id);

-- =====================================================
-- SCRIPT COMPLETADO
-- =====================================================
