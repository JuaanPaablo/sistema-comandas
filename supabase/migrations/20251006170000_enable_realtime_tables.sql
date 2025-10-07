-- Habilitar Realtime para public.tables
-- 1) Asegurar replica identity FULL para emisiones de DELETE/UPDATE
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'tables'
  ) THEN
    EXECUTE 'ALTER TABLE public.tables REPLICA IDENTITY FULL';
  END IF;
END $$;

-- 2) Crear la publicación si no existe y añadir la tabla
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    EXECUTE 'CREATE PUBLICATION supabase_realtime';
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;

-- 3) Permisos básicos de lectura (ajusta según tus políticas)
GRANT SELECT ON TABLE public.tables TO anon, authenticated;
