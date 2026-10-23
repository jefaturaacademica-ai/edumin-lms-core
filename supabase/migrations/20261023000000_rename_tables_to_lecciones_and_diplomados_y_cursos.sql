-- ==============================================================================
-- Migration: Renombrar tablas en Supabase
-- 1. 'diplomados_lecciones' (o 'diplomados_leciones') -> 'lecciones'
-- 2. 'cursos' -> 'diplomados_y_cursos'
-- ==============================================================================

DO $$
BEGIN
  -- ----------------------------------------------------------------------------
  -- 1. Renombrar tabla de lecciones a 'lecciones'
  -- ----------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'diplomados_lecciones'
  ) THEN
    ALTER TABLE public.diplomados_lecciones RENAME TO lecciones;
    RAISE NOTICE 'Tabla public.diplomados_lecciones renombrada a public.lecciones con éxito.';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'diplomados_leciones'
  ) THEN
    ALTER TABLE public.diplomados_leciones RENAME TO lecciones;
    RAISE NOTICE 'Tabla public.diplomados_leciones renombrada a public.lecciones con éxito.';
  ELSE
    RAISE NOTICE 'La tabla diplomados_lecciones o diplomados_leciones no existe o ya fue renombrada a lecciones.';
  END IF;

  -- ----------------------------------------------------------------------------
  -- 2. Renombrar tabla de cursos a 'diplomados_y_cursos'
  -- ----------------------------------------------------------------------------
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'cursos'
  ) THEN
    ALTER TABLE public.cursos RENAME TO diplomados_y_cursos;
    RAISE NOTICE 'Tabla public.cursos renombrada a public.diplomados_y_cursos con éxito.';
  ELSE
    RAISE NOTICE 'La tabla public.cursos no existe o ya fue renombrada a diplomados_y_cursos.';
  END IF;

END $$;

-- ------------------------------------------------------------------------------
-- 3. Renombrar o asegurar índices en public.lecciones
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_dip_lecciones_codigo') THEN
    ALTER INDEX idx_dip_lecciones_codigo RENAME TO idx_lecciones_codigo;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_dip_lecciones_modulo') THEN
    ALTER INDEX idx_dip_lecciones_modulo RENAME TO idx_lecciones_modulo;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_dip_lecciones_orden') THEN
    ALTER INDEX idx_dip_lecciones_orden RENAME TO idx_lecciones_orden;
  END IF;
END $$;

-- Asegurar creación de índices si no existen en public.lecciones
CREATE INDEX IF NOT EXISTS idx_lecciones_codigo ON public.lecciones("CodigoDiplomado");
CREATE INDEX IF NOT EXISTS idx_lecciones_modulo ON public.lecciones("Modulo");
CREATE INDEX IF NOT EXISTS idx_lecciones_orden ON public.lecciones(orden);

-- ------------------------------------------------------------------------------
-- 4. Habilitar RLS y Políticas de Seguridad
-- ------------------------------------------------------------------------------

-- Para public.lecciones
ALTER TABLE public.lecciones ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lecciones' AND policyname = 'Permitir lectura general a lecciones'
  ) THEN
    CREATE POLICY "Permitir lectura general a lecciones" 
    ON public.lecciones FOR SELECT 
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lecciones' AND policyname = 'Admin y ServiceRole control total sobre lecciones'
  ) THEN
    CREATE POLICY "Admin y ServiceRole control total sobre lecciones" 
    ON public.lecciones FOR ALL 
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Para public.diplomados_y_cursos
ALTER TABLE public.diplomados_y_cursos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'diplomados_y_cursos' AND policyname = 'Permitir lectura general a diplomados_y_cursos'
  ) THEN
    CREATE POLICY "Permitir lectura general a diplomados_y_cursos" 
    ON public.diplomados_y_cursos FOR SELECT 
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'diplomados_y_cursos' AND policyname = 'Admin y ServiceRole control total sobre diplomados_y_cursos'
  ) THEN
    CREATE POLICY "Admin y ServiceRole control total sobre diplomados_y_cursos" 
    ON public.diplomados_y_cursos FOR ALL 
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Conceder permisos de acceso estándar a roles de Supabase
GRANT ALL ON TABLE public.lecciones TO postgres, service_role, anon, authenticated;
GRANT ALL ON TABLE public.diplomados_y_cursos TO postgres, service_role, anon, authenticated;
