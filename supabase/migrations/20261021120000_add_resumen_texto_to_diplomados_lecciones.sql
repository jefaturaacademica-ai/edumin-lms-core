-- Migration: Agregar columna ResumenTexto a diplomados_lecciones
-- Almacena el resumen pedagógico y los temas clave estructurados en Markdown de cada clase

ALTER TABLE public.diplomados_lecciones 
ADD COLUMN IF NOT EXISTS "ResumenTexto" TEXT;
