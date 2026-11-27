-- ==============================================================================
-- Migración: Convertir profiles.paquete_adquirido a TEXT y vincular con public.paquetes
-- ==============================================================================
-- Permite que los paquetes creados desde la configuración (BASICO, AVANZADO, BECA, etc.) 
-- puedan asignarse a los estudiantes tanto en Supabase Table Editor como en la API del LMS.

-- 1. Modificar el tipo de columna a text manteniendo los datos actuales
ALTER TABLE public.profiles 
  ALTER COLUMN paquete_adquirido TYPE text USING paquete_adquirido::text;

-- 2. Establecer valor predeterminado 'COMPLETO'
ALTER TABLE public.profiles 
  ALTER COLUMN paquete_adquirido SET DEFAULT 'COMPLETO';

-- 3. Vincular como Foreign Key con la tabla public.paquetes(id)
-- Esto hace que el Table Editor de Supabase muestre automáticamente un menú desplegable
-- con TODOS los paquetes existentes en public.paquetes en lugar de solo los 3 del enum original.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS fk_profiles_paquete_adquirido;

ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_paquete_adquirido
  FOREIGN KEY (paquete_adquirido)
  REFERENCES public.paquetes(id)
  ON UPDATE CASCADE
  ON DELETE RESTRICT;
