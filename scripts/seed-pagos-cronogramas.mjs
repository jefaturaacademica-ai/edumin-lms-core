import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function seedPagosCronogramas() {
  console.log('--- REINICIANDO CRONOGRAMA DE CUOTAS EQUITATIVAS POR DEFECTO EN PUBLIC.PAGOS ---');

  const { data: profiles, error } = await admin.from('profiles').select('*').eq('role', 'ESTUDIANTE');
  if (error || !profiles) {
    console.error('Error obteniendo perfiles:', error);
    return;
  }

  // Limpiar la tabla de pagos completamente
  await admin.from('pagos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Reiniciar cuotas_pagadas a 0 en profiles
  await admin.from('profiles').update({ cuotas_pagadas: 0 }).neq('role', 'DOCENTE');

  for (const p of profiles) {
    let cuotas = [];

    if (p.dni_ce === '71234567') {
      // Juan Carlos Quispe: COMPLETO (2 cuotas equitativas de 270.00)
      cuotas = [{ monto: 270.00 }, { monto: 270.00 }];
    } else if (p.dni_ce === '72345678') {
      // Lucía María Fernández: COMPLETO (3 cuotas equitativas de 180.00)
      cuotas = [{ monto: 180.00 }, { monto: 180.00 }, { monto: 180.00 }];
    } else if (p.dni_ce === '73456789') {
      // Renzo Alexander Mendoza: FULL Contado (1 cuota de 900.00)
      cuotas = [{ monto: 900.00 }];
    } else if (p.dni_ce === '74567890') {
      // Fiorella Beatriz Chávez: FULL Cuotas (6 cuotas equitativas de 150.00)
      cuotas = [
        { monto: 150.00 }, { monto: 150.00 }, { monto: 150.00 },
        { monto: 150.00 }, { monto: 150.00 }, { monto: 150.00 }
      ];
    } else if (p.dni_ce === '75678901') {
      // Carlos Alberto Ríos: ILIMITADO Contado (1 cuota de 1500.00)
      cuotas = [{ monto: 1500.00 }];
    } else if (p.dni_ce === '76789012') {
      // Andrea Sofía Gómez Salazar: ILIMITADO Cuotas (6 cuotas equitativas de 250.00)
      cuotas = [
        { monto: 250.00 }, { monto: 250.00 }, { monto: 250.00 },
        { monto: 250.00 }, { monto: 250.00 }, { monto: 250.00 }
      ];
    } else {
      // Demás estudiantes: 3 cuotas equitativas de 180.00
      cuotas = [{ monto: 180.00 }, { monto: 180.00 }, { monto: 180.00 }];
    }

    // Insertar registros en public.pagos con estado 'Pendiente'
    for (const c of cuotas) {
      const { error: insertError } = await admin.from('pagos').insert({
        profile_id: p.id,
        dni_ce: p.dni_ce,
        monto: c.monto,
        metodo: 'Por Pagar',
        estado: 'Pendiente'
      });

      if (insertError) {
        console.error(`❌ Error insertando cuota para DNI ${p.dni_ce}:`, insertError.message);
      } else {
        console.log(`  💳 Cuota Pendiente Equitativa para ${p.nombres} (${p.dni_ce}): S/ ${c.monto.toFixed(2)}`);
      }
    }
  }

  console.log('--- SEED REINICIADO CON ÉXITO ---');
}

seedPagosCronogramas();
