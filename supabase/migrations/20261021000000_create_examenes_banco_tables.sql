-- ==============================================================================
-- MIGRACIÓN SIMPLIFICADA: BANCO DE PREGUNTAS Y ACTUALIZACIÓN DE NOTAS_MODULOS
-- ==============================================================================

-- 1. ÚNICA TABLA NUEVA: public.banco_preguntas
-- Almacena el repositorio de preguntas para Diplomados y Cursos
CREATE TABLE IF NOT EXISTS public.banco_preguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_diplomado VARCHAR(50) NOT NULL, -- Código del Diplomado o Curso (ej: 'DIP-01', 'CUR-01')
  diplomado VARCHAR(255) NOT NULL,        -- Nombre del Diplomado o Curso
  modulo VARCHAR(100) NOT NULL,          -- Módulo al que pertenece (ej: 'Módulo 01', 'General')
  dificultad VARCHAR(20) NOT NULL DEFAULT 'MEDIO', -- 'FACIL', 'MEDIO', 'ALTO'
  tipo VARCHAR(50) NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice' (opción única) | 'multiple_select' (selección múltiple)
  pregunta TEXT NOT NULL,
  opciones JSONB NOT NULL,               -- Array de opciones [{ "text": "...", "isCorrect": true|false, "rationale": "..." }]
  hint TEXT,                             -- Pista formativa opcional
  activo BOOLEAN NOT NULL DEFAULT true,  -- Permite pausar/activar del sorteo
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de búsqueda rápida para sorteo aleatorio
CREATE INDEX IF NOT EXISTS idx_banco_preguntas_busqueda 
  ON public.banco_preguntas(codigo_diplomado, modulo, activo);
CREATE INDEX IF NOT EXISTS idx_banco_preguntas_tipo 
  ON public.banco_preguntas(tipo);

-- Habilitar RLS en banco_preguntas
ALTER TABLE public.banco_preguntas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banco_preguntas' AND policyname = 'Permitir lectura general banco_preguntas') THEN
    CREATE POLICY "Permitir lectura general banco_preguntas" ON public.banco_preguntas FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'banco_preguntas' AND policyname = 'Admin control total banco_preguntas') THEN
    CREATE POLICY "Admin control total banco_preguntas" ON public.banco_preguntas FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. AMPLIAR TU TABLA EXISTENTE: public.notas_modulos
-- Agrega columnas para almacenar las respuestas del intento y la retroalimentación
ALTER TABLE public.notas_modulos 
  ADD COLUMN IF NOT EXISTS respuestas JSONB,
  ADD COLUMN IF NOT EXISTS detalles_examen JSONB;
