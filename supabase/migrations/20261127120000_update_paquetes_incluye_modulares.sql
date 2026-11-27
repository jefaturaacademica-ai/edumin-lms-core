-- Limpiar columnas innecesarias (modulares, diplomas) y agregar incluye_modulares en public.paquetes
ALTER TABLE public.paquetes
  ADD COLUMN IF NOT EXISTS incluye_modulares BOOLEAN NOT NULL DEFAULT true;

UPDATE public.paquetes
SET incluye_modulares = false
WHERE id = 'BASICO';

ALTER TABLE public.paquetes
  DROP COLUMN IF EXISTS modulares,
  DROP COLUMN IF EXISTS diplomas;
