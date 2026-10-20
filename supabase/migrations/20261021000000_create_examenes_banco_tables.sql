-- ==============================================================================
-- MIGRACIÓN: Sistema Integral de Banco de Preguntas y Exámenes Modulares
-- ==============================================================================

-- 1. TABLA: public.banco_preguntas
-- Repositorio maestro y escalable de preguntas por diplomado y módulo
CREATE TABLE IF NOT EXISTS public.banco_preguntas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_diplomado VARCHAR(50) NOT NULL,
  diplomado VARCHAR(255) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  dificultad VARCHAR(20) NOT NULL DEFAULT 'MEDIO', -- 'FACIL', 'MEDIO', 'ALTO'
  tipo VARCHAR(50) NOT NULL DEFAULT 'multiple_choice', -- 'multiple_choice' | 'multiple_select'
  pregunta TEXT NOT NULL,
  opciones JSONB NOT NULL, -- Array de objetos: [{ "text": "...", "isCorrect": true|false, "rationale": "..." }]
  hint TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de alto rendimiento para búsqueda y sorteo aleatorio
CREATE INDEX IF NOT EXISTS idx_banco_preguntas_busqueda 
  ON public.banco_preguntas(codigo_diplomado, modulo, activo);
CREATE INDEX IF NOT EXISTS idx_banco_preguntas_tipo 
  ON public.banco_preguntas(tipo);
CREATE INDEX IF NOT EXISTS idx_banco_preguntas_dificultad 
  ON public.banco_preguntas(dificultad);

-- 2. TABLA: public.examenes_modulos
-- Configuración de evaluación por cada módulo de diplomado
CREATE TABLE IF NOT EXISTS public.examenes_modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_diplomado VARCHAR(50) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  titulo VARCHAR(255),
  cantidad_preguntas INTEGER NOT NULL DEFAULT 10,
  tiempo_minutos INTEGER DEFAULT 30,
  nota_aprobatoria NUMERIC(4,2) NOT NULL DEFAULT 12.00,
  puntaje_maximo NUMERIC(4,2) NOT NULL DEFAULT 20.00,
  intentos_permitidos INTEGER NOT NULL DEFAULT 1,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_examen_diplomado_modulo UNIQUE (codigo_diplomado, modulo)
);

-- 3. TABLA: public.examenes_intentos
-- Registro de intentos rendidos por estudiantes con preguntas sorteadas y retroalimentación
CREATE TABLE IF NOT EXISTS public.examenes_intentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dni VARCHAR(50) NOT NULL,
  codigo_diplomado VARCHAR(50) NOT NULL,
  modulo VARCHAR(50) NOT NULL,
  preguntas_ids JSONB NOT NULL, -- Array de UUIDs de las 10 preguntas sorteadas
  respuestas JSONB NOT NULL, -- Objeto con respuestas marcadas por pregunta
  detalles_calificacion JSONB, -- Desglose completo de aciertos, puntajes y rationales
  nota NUMERIC(4,2) NOT NULL,
  aprobado BOOLEAN NOT NULL,
  fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_examenes_intentos_estudiante 
  ON public.examenes_intentos(dni, codigo_diplomado, modulo);

-- ==============================================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.banco_preguntas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examenes_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examenes_intentos ENABLE ROW LEVEL SECURITY;

-- Acceso a banco_preguntas:
-- Lectura permitida para usuarios autenticados y anónimos (los endpoints filtran respuestas correctas al alumno)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'banco_preguntas' AND policyname = 'Permitir lectura general banco_preguntas'
  ) THEN
    CREATE POLICY "Permitir lectura general banco_preguntas" 
    ON public.banco_preguntas FOR SELECT 
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'banco_preguntas' AND policyname = 'Admin control total banco_preguntas'
  ) THEN
    CREATE POLICY "Admin control total banco_preguntas" 
    ON public.banco_preguntas FOR ALL 
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Acceso a examenes_modulos:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'examenes_modulos' AND policyname = 'Permitir lectura general examenes_modulos'
  ) THEN
    CREATE POLICY "Permitir lectura general examenes_modulos" 
    ON public.examenes_modulos FOR SELECT 
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'examenes_modulos' AND policyname = 'Admin control total examenes_modulos'
  ) THEN
    CREATE POLICY "Admin control total examenes_modulos" 
    ON public.examenes_modulos FOR ALL 
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Acceso a examenes_intentos:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'examenes_intentos' AND policyname = 'Permitir insercion y lectura examenes_intentos'
  ) THEN
    CREATE POLICY "Permitir insercion y lectura examenes_intentos" 
    ON public.examenes_intentos FOR ALL 
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;
