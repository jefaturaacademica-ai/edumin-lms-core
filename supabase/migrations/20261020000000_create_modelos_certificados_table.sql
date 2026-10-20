-- Migration: Create modelos_certificados table for storing certificate templates in Supabase
CREATE TABLE IF NOT EXISTS public.modelos_certificados (
  id VARCHAR(100) PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL, -- 'DIPLOMA', 'MODULAR', 'CURSO', 'CIP', 'MIAMI', 'TALLER'
  orientacion VARCHAR(20) NOT NULL DEFAULT 'horizontal', -- 'horizontal' (A4 landscape) o 'vertical' (A4 portrait)
  horas VARCHAR(100),
  firmas TEXT[] DEFAULT ARRAY['Director Académico']::TEXT[],
  incluye_qr BOOLEAN DEFAULT true,
  es_predeterminado BOOLEAN DEFAULT false,
  imagen_fondo_url TEXT, -- URL pública permanente en Supabase Storage (bucket: certificados/fondos/...)
  asignacion_alcance VARCHAR(50) DEFAULT 'SUPERPLANTILLA_GLOBAL', -- 'SUPERPLANTILLA_GLOBAL' o 'PRODUCTO_ESPECIFICO'
  recurso_asignado_nombre VARCHAR(255),
  recurso_asignado_id VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.modelos_certificados ENABLE ROW LEVEL SECURITY;

-- Política: lectura pública de modelos oficiales
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'modelos_certificados' AND policyname = 'Lectura publica de modelos de certificados'
  ) THEN
    CREATE POLICY "Lectura publica de modelos de certificados" 
    ON public.modelos_certificados FOR SELECT 
    USING (true);
  END IF;
END $$;

-- Política: Administradores control total sobre modelos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'modelos_certificados' AND policyname = 'Admin control total modelos_certificados'
  ) THEN
    CREATE POLICY "Admin control total modelos_certificados" 
    ON public.modelos_certificados FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND (profiles.role = 'ADMIN' OR profiles.role = 'SUPERADMIN')
      )
    );
  END IF;
END $$;
