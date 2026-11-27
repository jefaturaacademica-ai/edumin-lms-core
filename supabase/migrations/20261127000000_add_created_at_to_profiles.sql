-- Agregar columna created_at a public.profiles y rellenar registros existentes desde auth.users
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

UPDATE public.profiles p
SET created_at = u.created_at
FROM auth.users u
WHERE p.id = u.id
  AND u.created_at IS NOT NULL;
