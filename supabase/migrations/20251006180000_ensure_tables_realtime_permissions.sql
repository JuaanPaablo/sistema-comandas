-- Asegurar permisos para realtime en public.tables
-- 1) Deshabilitar RLS temporalmente si está bloqueando (opcional)
-- ALTER TABLE public.tables DISABLE ROW LEVEL SECURITY;

-- 2) Crear política permisiva para lectura (si RLS está habilitado)
DO $$
BEGIN
  -- Solo crear política si RLS está habilitado
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'tables' AND rowsecurity = true
  ) THEN
    -- Eliminar políticas existentes que puedan bloquear
    DROP POLICY IF EXISTS "Allow read access for realtime" ON public.tables;
    
    -- Crear política permisiva para lectura
    CREATE POLICY "Allow read access for realtime" ON public.tables
      FOR SELECT USING (true);
  END IF;
END $$;

-- 3) Asegurar permisos explícitos
GRANT SELECT ON TABLE public.tables TO anon;
GRANT SELECT ON TABLE public.tables TO authenticated;
GRANT SELECT ON TABLE public.tables TO service_role;

-- 4) Verificar que la tabla esté en la publicación
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tables'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
  END IF;
END $$;

-- 5) Verificar replica identity
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tables'
  ) THEN
    -- Solo cambiar si no es ya FULL
    IF NOT EXISTS (
      SELECT 1 FROM pg_class 
      WHERE relname = 'tables' 
      AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND relreplident = 'f'
    ) THEN
      ALTER TABLE public.tables REPLICA IDENTITY FULL;
    END IF;
  END IF;
END $$;
