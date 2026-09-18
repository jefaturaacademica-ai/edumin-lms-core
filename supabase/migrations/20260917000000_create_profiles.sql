-- Edumin LMS: perfiles, roles y control de acceso.
-- Ejecutar esta migración con la CLI de Supabase o en el SQL Editor del proyecto.

create type public.profile_role as enum (
  'SUPERADMIN',
  'ADMIN',
  'DOCENTE',
  'ESTUDIANTE'
);

create type public.paquete_adquirido as enum (
  'COMPLETO',
  'FULL',
  'ILIMITADO'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.profile_role not null,
  dni_ce text not null unique,
  email text not null unique,
  nombres text not null,
  apellidos text not null,
  telefono text not null,
  paquete_adquirido public.paquete_adquirido not null,
  cuotas_pagadas integer not null default 1 check (cuotas_pagadas >= 0),
  cupos_diplomados integer not null default 0 check (cupos_diplomados >= 0),
  debe_cambiar_password boolean not null default true
);

comment on table public.profiles is 'Perfil y autorización de cada usuario autenticado de Edumin.';

alter table public.profiles enable row level security;

-- SECURITY DEFINER evita que la política se consulte a sí misma y provoque
-- recursión. La función no acepta argumentos y sólo revela un booleano.
create function public.es_administrador_actual()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('SUPERADMIN'::public.profile_role, 'ADMIN'::public.profile_role)
  );
$$;

revoke all on function public.es_administrador_actual() from public;
grant execute on function public.es_administrador_actual() to authenticated;

-- Un estudiante únicamente puede consultar su propio perfil. No hay políticas
-- de INSERT, UPDATE o DELETE para estudiantes ni docentes.
create policy "students_can_read_own_profile"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  and role = 'ESTUDIANTE'::public.profile_role
);

-- ADMIN y SUPERADMIN son los únicos roles de aplicación con CRUD completo.
create policy "administrators_have_full_profiles_access"
on public.profiles
for all
to authenticated
using (public.es_administrador_actual())
with check (public.es_administrador_actual());

-- El primer SUPERADMIN debe aprovisionarse desde un entorno confiable (SQL
-- Editor como propietario de la BD, CLI con service_role o backend seguro),
-- ya que RLS bloquea correctamente el alta directa de usuarios finales.
