-- Actualización de la tabla public.cursos para soportar Versión, Año, # Módulos, Taller, Docente y Módulos JSONB
create table if not exists public.cursos (
  id text primary key,
  codigo text not null,
  version text default 'Versión 1',
  ano integer default 2026,
  titulo text not null,
  tipo text not null default 'curso', -- 'diplomado', 'curso', 'taller'
  categoria text not null default 'Cursos de Alta Especialización', -- 'Diplomados Oficiales', 'Cursos de Alta Especialización', 'Talleres'
  num_modulos integer default 3,
  taller_aplicable text default 'Ninguno',
  docente text default 'Por asignar',
  duracion text default '40 horas',
  imagen text default '/assets/images/daem/gestion-minera.webp',
  nivel text default 'Especialización',
  precio numeric default 150.00,
  modulos jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Asegurar columnas si la tabla ya existía anteriormente
alter table public.cursos add column if not exists codigo text;
alter table public.cursos add column if not exists version text default 'Versión 1';
alter table public.cursos add column if not exists ano integer default 2026;
alter table public.cursos add column if not exists tipo text default 'curso';
alter table public.cursos add column if not exists num_modulos integer default 3;
alter table public.cursos add column if not exists taller_aplicable text default 'Ninguno';
alter table public.cursos add column if not exists docente text default 'Por asignar';
alter table public.cursos add column if not exists modulos jsonb default '[]'::jsonb;
