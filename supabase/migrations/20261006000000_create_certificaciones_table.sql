-- Migration: Create certificaciones table for official certificate snapshotting and public validation
CREATE TABLE IF NOT EXISTS public.certificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_verificacion VARCHAR(100) UNIQUE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  dni_ce VARCHAR(20) NOT NULL,
  estudiante_nombre VARCHAR(255) NOT NULL,
  estudiante_email VARCHAR(255),
  
  -- Clasificación del Certificado
  tipo VARCHAR(50) NOT NULL, -- 'DIPLOMA', 'MODULAR', 'CURSO', 'CIP', 'MIAMI', 'TALLER'
  programa_titulo VARCHAR(255) NOT NULL,
  modulo_nombre VARCHAR(255),
  
  -- Datos Académicos
  nota NUMERIC(4,2) DEFAULT 0,
  horas_lectivas VARCHAR(50) DEFAULT '120 horas cronológicas',
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Estado y Habilitación Financiera
  estado VARCHAR(50) DEFAULT 'Emitido', -- 'Pendiente', 'Emitido', 'Retenido_Deuda', 'Anulado'
  habilitado BOOLEAN DEFAULT true,
  
  -- Snapshot Inmutable del Diseño al Emitir
  plantilla_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Almacenamiento Digital
  pdf_storage_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas y validación QR ultra rápidas
CREATE INDEX IF NOT EXISTS idx_cert_codigo ON public.certificaciones(codigo_verificacion);
CREATE INDEX IF NOT EXISTS idx_cert_profile ON public.certificaciones(profile_id);
CREATE INDEX IF NOT EXISTS idx_cert_dni ON public.certificaciones(dni_ce);
CREATE INDEX IF NOT EXISTS idx_cert_tipo ON public.certificaciones(tipo);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.certificaciones ENABLE ROW LEVEL SECURITY;

-- Política 1: Lectura pública de certificados válidos (Para el módulo de validación QR /validar/[codigo])
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'certificaciones' AND policyname = 'Permitir validacion publica por codigo QR'
  ) THEN
    CREATE POLICY "Permitir validacion publica por codigo QR" 
    ON public.certificaciones FOR SELECT 
    USING (estado = 'Emitido' AND habilitado = true);
  END IF;
END $$;

-- Política 2: Los administradores tienen control total sobre los certificados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'certificaciones' AND policyname = 'Admin control total sobre certificaciones'
  ) THEN
    CREATE POLICY "Admin control total sobre certificaciones" 
    ON public.certificaciones FOR ALL 
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() AND (profiles.role = 'ADMIN' OR profiles.role = 'SUPERADMIN')
      )
    );
  END IF;
END $$;
