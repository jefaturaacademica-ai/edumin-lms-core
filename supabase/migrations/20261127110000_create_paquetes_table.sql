-- Crear tabla dedicada para la configuración de paquetes del LMS
CREATE TABLE IF NOT EXISTS public.paquetes (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  precio_contado NUMERIC NOT NULL DEFAULT 0,
  precio_cuotas NUMERIC NOT NULL DEFAULT 0,
  cuotas_sugeridas INTEGER NOT NULL DEFAULT 1,
  creditos_diplomados INTEGER NOT NULL DEFAULT 1,
  creditos_cursos INTEGER NOT NULL DEFAULT 0,
  duracion_meses INTEGER NOT NULL DEFAULT 12,
  diplomados_renovables BOOLEAN NOT NULL DEFAULT false,
  modulares INTEGER NOT NULL DEFAULT 3,
  diplomas INTEGER NOT NULL DEFAULT 1,
  cert_cip BOOLEAN NOT NULL DEFAULT false,
  cert_internacional BOOLEAN NOT NULL DEFAULT false,
  bolsa_trabajo_regular BOOLEAN NOT NULL DEFAULT true,
  bolsa_trabajo_exclusiva BOOLEAN NOT NULL DEFAULT false,
  dreambuilder BOOLEAN NOT NULL DEFAULT true,
  es_personalizado BOOLEAN NOT NULL DEFAULT false,
  color_tag TEXT NOT NULL DEFAULT 'indigo',
  orden INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.paquetes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'paquetes' AND policyname = 'Lectura general paquetes'
  ) THEN
    CREATE POLICY "Lectura general paquetes" ON public.paquetes FOR SELECT USING (true);
  END IF;
END $$;

-- Sembrar los paquetes actuales
INSERT INTO public.paquetes (
  id, nombre, descripcion, precio_contado, precio_cuotas, cuotas_sugeridas,
  creditos_diplomados, creditos_cursos, duracion_meses, diplomados_renovables,
  modulares, diplomas, cert_cip, cert_internacional,
  bolsa_trabajo_regular, bolsa_trabajo_exclusiva, dreambuilder,
  es_personalizado, color_tag, orden
) VALUES
  ('COMPLETO', 'Paquete COMPLETO', 'Reglas de emisión y límites de cursos para alumnos matriculados en modalidad Completo.', 540, 540, 3, 1, 3, 12, false, 3, 1, false, false, true, false, true, false, 'indigo', 1),
  ('FULL', 'Paquete FULL', 'Incluye más cursos libres y derecho a certificación digital del Colegio de Ingenieros.', 900, 900, 3, 1, 5, 12, false, 3, 1, true, true, true, true, true, false, 'amber', 2),
  ('ILIMITADO', 'Paquete ILIMITADO', 'Progresión ilimitada por bloques con aprobación directa de módulos.', 1500, 1500, 5, 3, 15, 24, true, 10, 5, true, true, true, true, true, false, 'purple', 3),
  ('BECA', 'Paquete BECA', 'Beneficio especial para estudiantes becados.', 0, 0, 1, 1, 3, 12, false, 3, 1, false, false, true, false, true, true, 'emerald', 4),
  ('ESTANDAR', 'Paquete ESTANDAR', 'Paquete estándar de acceso a la plataforma.', 540, 540, 3, 1, 3, 8, false, 3, 1, false, false, true, false, true, true, 'emerald', 5),
  ('AVANZADO', 'Paquete AVANZADO', 'Paquete avanzado con renovación automática de créditos de diplomado.', 1200, 1200, 4, 3, 10, 12, true, 6, 3, true, true, true, true, true, true, 'emerald', 6)
ON CONFLICT (id) DO NOTHING;
