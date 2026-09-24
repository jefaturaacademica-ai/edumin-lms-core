-- Agregar columnas para cronogramas, cuotas totales y monto de cuota en public.profiles
alter table public.profiles add column if not exists cuotas_totales integer default 3;
alter table public.profiles add column if not exists monto_cuota numeric default 150.00;
alter table public.profiles add column if not exists cronogramas jsonb default '[]'::jsonb;
