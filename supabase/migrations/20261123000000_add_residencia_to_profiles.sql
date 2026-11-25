-- Migración para soporte de lugar de residencia en perfiles de estudiantes
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS residencia TEXT DEFAULT NULL;

COMMENT ON COLUMN public.profiles.residencia IS 'Lugar de residencia del estudiante o usuario (ciudad, país, distrito)';
