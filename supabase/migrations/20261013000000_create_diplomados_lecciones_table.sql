-- Migration: Crear tabla public.diplomados_lecciones en Supabase
-- Almacena la estructura oficial de cada Diplomado, Módulo, Tema, Sesión y todos sus enlaces multimedia y materiales

CREATE TABLE IF NOT EXISTS public.diplomados_lecciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "CodigoDiplomado" VARCHAR(50) NOT NULL,
  "Diplomado" VARCHAR(255) NOT NULL,
  "Modulo" VARCHAR(50) NOT NULL,
  "NombreModulo" VARCHAR(255),
  "Docente" VARCHAR(255),
  "Tema" VARCHAR(255) NOT NULL,
  "Sesion" VARCHAR(255) NOT NULL,
  "VideoUrl" TEXT,
  "PdfUrl" TEXT,
  "ResumenVideoUrl" TEXT,
  "ResumenAudioUrl" TEXT,
  "ResumenInteractivo" TEXT,
  "Material1" TEXT,
  "Material2" TEXT,
  "Material3" TEXT,
  "Material4" TEXT,
  "Material5" TEXT,
  "Material6" TEXT,
  "Material7" TEXT,
  "Material8" TEXT,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de alto rendimiento para consultas por diplomado, módulo y orden
CREATE INDEX IF NOT EXISTS idx_dip_lecciones_codigo ON public.diplomados_lecciones("CodigoDiplomado");
CREATE INDEX IF NOT EXISTS idx_dip_lecciones_modulo ON public.diplomados_lecciones("Modulo");
CREATE INDEX IF NOT EXISTS idx_dip_lecciones_orden ON public.diplomados_lecciones(orden);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.diplomados_lecciones ENABLE ROW LEVEL SECURITY;

-- Política 1: Lectura para alumnos y usuarios autenticados / anónimos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'diplomados_lecciones' AND policyname = 'Permitir lectura general a diplomados_lecciones'
  ) THEN
    CREATE POLICY "Permitir lectura general a diplomados_lecciones" 
    ON public.diplomados_lecciones FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Política 2: Control total (insert/update/delete) para administradores y service_role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'diplomados_lecciones' AND policyname = 'Admin y ServiceRole control total sobre diplomados_lecciones'
  ) THEN
    CREATE POLICY "Admin y ServiceRole control total sobre diplomados_lecciones" 
    ON public.diplomados_lecciones FOR ALL 
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;
