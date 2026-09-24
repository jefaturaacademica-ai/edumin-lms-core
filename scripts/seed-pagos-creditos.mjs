import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function seedPagosCreditos() {
  console.log('--- REINICIANDO REGISTROS DE CRÉDITOS EN PUBLIC.PAGOS Y AUDIT_LOGS ---');

  const { data: profiles, error } = await admin.from('profiles').select('*').eq('role', 'ESTUDIANTE');
  if (error || !profiles) {
    console.error('Error obteniendo perfiles:', error);
    return;
  }

  const profileMap = new Map();
  profiles.forEach(p => profileMap.set(p.dni_ce, p.id));

  // Limpiar la tabla de pagos completamente
  await admin.from('pagos').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Limpiar configuraciones previas de creditos en audit_logs
  await admin.from('audit_logs').delete().eq('accion', 'REGISTRO_CREDITOS_STUDENT');

  // Reiniciar cuotas_pagadas a 0 en profiles
  await admin.from('profiles').update({ cuotas_pagadas: 0 }).neq('role', 'DOCENTE');

  // Arreglo exacto de créditos según el CSV del usuario
  const creditosRaw = [
    // Andrea Sofía Gómez Salazar (76789012) - 3 créditos
    {
      dni_ce: '76789012',
      num_credito: 1,
      monto: 250,
      metodo: 'Por Pagar',
      estado: 'Pendiente',
      cuotas: ['250', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: 250,
      total_deuda: 0
    },
    {
      dni_ce: '76789012',
      num_credito: 2,
      monto: 250,
      metodo: 'Por Pagar',
      estado: 'Pendiente',
      cuotas: ['250', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: 250,
      total_deuda: 0
    },
    {
      dni_ce: '76789012',
      num_credito: 3,
      monto: 250,
      metodo: 'Por Pagar',
      estado: 'Pendiente',
      cuotas: ['0', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: 0,
      total_deuda: 250
    },
    // Juan Carlos Quispe (71234567) - 1 crédito de 270 (2 cuotas)
    {
      dni_ce: '71234567',
      num_credito: 1,
      monto: 270,
      metodo: 'Por Pagar',
      estado: 'Pendiente',
      cuotas: ['135', '0', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: 135,
      total_deuda: 135
    },
    // Lucía María Fernández (72345678) - 2 créditos
    {
      dni_ce: '72345678',
      num_credito: 1,
      monto: 180,
      metodo: 'Por Pagar',
      estado: 'Pendiente',
      cuotas: ['60', '60', '0', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: 120,
      total_deuda: 60
    },
    {
      dni_ce: '72345678',
      num_credito: 2,
      monto: 180,
      metodo: 'Por Pagar',
      estado: 'Pendiente',
      cuotas: ['0', '0', '0', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: 0,
      total_deuda: 180
    },
    // Fiorella Beatriz Chávez (74567890) - 2 créditos
    {
      dni_ce: '74567890',
      num_credito: 1,
      monto: 150,
      metodo: 'Por Pagar',
      estado: 'Pendiente',
      cuotas: ['100', '0', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: 100,
      total_deuda: 50
    },
    {
      dni_ce: '74567890',
      num_credito: 2,
      monto: 150,
      metodo: 'Por Pagar',
      estado: 'Pendiente',
      cuotas: ['0', '0', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: 0,
      total_deuda: 150
    },
    // Carlos Alberto Ríos (75678901) - 1 crédito de 1500 (6 cuotas)
    {
      dni_ce: '75678901',
      num_credito: 1,
      monto: 1500,
      metodo: 'Por Pagar',
      estado: 'Pendiente',
      cuotas: ['250', '250', '250', '0', '0', '0'],
      total_pagado: 750,
      total_deuda: 750
    },
    // Alumno DNI 77777777
    {
      dni_ce: '77777777',
      num_credito: 1,
      monto: 180,
      metodo: 'Por Pagar',
      estado: 'Pendiente',
      cuotas: ['0', '0', '0', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: 0,
      total_deuda: 180
    },
    // Alumno DNI 22222222
    {
      dni_ce: '22222222',
      num_credito: 1,
      monto: 180,
      metodo: 'Por Pagar',
      estado: 'Pendiente',
      cuotas: ['0', '0', '0', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: 0,
      total_deuda: 180
    },
    // Alumno DNI 33333333
    {
      dni_ce: '33333333',
      num_credito: 1,
      monto: 180,
      metodo: 'Por Pagar',
      estado: 'Pendiente',
      cuotas: ['0', '0', '0', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: 0,
      total_deuda: 180
    }
  ];

  for (const item of creditosRaw) {
    const profileId = profileMap.get(item.dni_ce);
    if (!profileId) {
      console.warn(`⚠️ No se encontró perfil para DNI ${item.dni_ce}, omitiendo...`);
      continue;
    }

    // Insertar 1 fila por crédito en public.pagos
    // Guardamos la metadata compacta del crédito en `metodo` o `audit_logs`
    const metadataMetodo = `CREDITO_${item.num_credito}|${JSON.stringify({
      num_credito: item.num_credito,
      cuotas: item.cuotas,
      total_pagado: item.total_pagado,
      total_deuda: item.total_deuda
    })}`;

    const { data: newPago, error: insErr } = await admin.from('pagos').insert({
      profile_id: profileId,
      dni_ce: item.dni_ce,
      monto: item.monto,
      metodo: metadataMetodo,
      estado: item.estado
    }).select().single();

    if (insErr) {
      console.error(`❌ Error insertando crédito #${item.num_credito} para DNI ${item.dni_ce}:`, insErr.message);
      continue;
    }

    // Guardar también en audit_logs para trazabilidad forense
    await admin.from('audit_logs').insert({
      usuario_email: 'admin@edumin.pe',
      accion: 'REGISTRO_CREDITOS_STUDENT',
      detalles: {
        pago_id: newPago.id,
        profile_id: profileId,
        dni_ce: item.dni_ce,
        num_credito: item.num_credito,
        monto: item.monto,
        metodo: item.metodo,
        estado: item.estado,
        cuotas: item.cuotas,
        total_pagado: item.total_pagado,
        total_deuda: item.total_deuda
      }
    });

    console.log(`✅ Crédito #${item.num_credito} registrado en Supabase para DNI ${item.dni_ce} (Monto: S/ ${item.monto}, Pagado: S/ ${item.total_pagado}, Deuda: S/ ${item.total_deuda})`);
  }

  console.log('--- SEED DE CRÉDITOS COMPLETADO CON ÉXITO EN SUPABASE ---');
}

seedPagosCreditos();
