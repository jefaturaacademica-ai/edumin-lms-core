-- Migration: Update public.pagos table to single-row credit architecture
-- Columns for num_credito, cuota 01..cuota 06, total pagado, and total deuda

ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS num_credito INTEGER DEFAULT 1;

-- Support column names with spaces as in user CSV
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "cuota 01" TEXT DEFAULT '0';
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "cuota 02" TEXT DEFAULT 'no corresponde';
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "cuota 03" TEXT DEFAULT 'no corresponde';
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "cuota 04" TEXT DEFAULT 'no corresponde';
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "cuota 05" TEXT DEFAULT 'no corresponde';
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "cuota 06" TEXT DEFAULT 'no corresponde';

ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "total pagado" NUMERIC DEFAULT 0;
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "total deuda" NUMERIC DEFAULT 0;

-- Support snake_case alias columns for safe JS property access
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cuota_01 TEXT DEFAULT '0';
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cuota_02 TEXT DEFAULT 'no corresponde';
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cuota_03 TEXT DEFAULT 'no corresponde';
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cuota_04 TEXT DEFAULT 'no corresponde';
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cuota_05 TEXT DEFAULT 'no corresponde';
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cuota_06 TEXT DEFAULT 'no corresponde';

ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS total_pagado NUMERIC DEFAULT 0;
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS total_deuda NUMERIC DEFAULT 0;
