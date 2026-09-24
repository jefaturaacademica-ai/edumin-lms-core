import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function applyMigration() {
  const sqlCommands = [
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS num_credito INTEGER DEFAULT 1;`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "cuota 01" TEXT DEFAULT '0';`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "cuota 02" TEXT DEFAULT 'no corresponde';`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "cuota 03" TEXT DEFAULT 'no corresponde';`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "cuota 04" TEXT DEFAULT 'no corresponde';`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "cuota 05" TEXT DEFAULT 'no corresponde';`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "cuota 06" TEXT DEFAULT 'no corresponde';`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "total pagado" NUMERIC DEFAULT 0;`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS "total deuda" NUMERIC DEFAULT 0;`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cuota_01 TEXT DEFAULT '0';`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cuota_02 TEXT DEFAULT 'no corresponde';`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cuota_03 TEXT DEFAULT 'no corresponde';`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cuota_04 TEXT DEFAULT 'no corresponde';`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cuota_05 TEXT DEFAULT 'no corresponde';`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS cuota_06 TEXT DEFAULT 'no corresponde';`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS total_pagado NUMERIC DEFAULT 0;`,
    `ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS total_deuda NUMERIC DEFAULT 0;`
  ];

  for (const query of sqlCommands) {
    // Probar ejecución de SQL usando el endpoint SQL o RPC de Supabase
    try {
      const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify({ query })
      });
      console.log(`Query: ${query} -> status: ${res.status}`);
    } catch (e) {
      console.error(e);
    }
  }
}

applyMigration();
