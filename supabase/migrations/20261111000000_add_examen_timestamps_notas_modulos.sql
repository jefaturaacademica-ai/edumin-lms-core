-- Agregar columnas para registrar fecha/hora de inicio y fin de cada intento de examen
ALTER TABLE public.notas_modulos
  ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS fecha_fin TIMESTAMP WITH TIME ZONE;
