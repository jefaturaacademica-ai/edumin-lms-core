import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function testCols() {
  const candidateCols = [
    'num_credito',
    'comprobante',
    'concepto',
    'nro_cuota',
    'detalles',
    'motivo_anulacion',
    'cuota_01',
    'cuota_02',
    'total_pagado',
    'total_deuda'
  ];

  for (const col of candidateCols) {
    const { error } = await admin.from('pagos').insert({
      profile_id: '77e500e8-9fb7-408d-b154-19605c321dd2',
      dni_ce: '76789012',
      monto: 10,
      metodo: 'Test',
      estado: 'Test',
      [col]: col === 'num_credito' ? 1 : 'val'
    });
    if (error) {
      console.log(`❌ Column '${col}' DOES NOT exist: ${error.message}`);
    } else {
      console.log(`✅ Column '${col}' EXISTS in public.pagos!`);
    }
  }

  // Clean test rows
  await admin.from('pagos').delete().eq('metodo', 'Test');
}

testCols();
