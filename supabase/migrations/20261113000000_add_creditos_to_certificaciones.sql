-- Migration: Add creditos column to certificaciones table so issued certificates store credits alongside hours
ALTER TABLE public.certificaciones
  ADD COLUMN IF NOT EXISTS creditos VARCHAR(50);
