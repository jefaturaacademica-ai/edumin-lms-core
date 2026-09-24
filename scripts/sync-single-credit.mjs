import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function syncSingleCredit() {
  console.log('--- SINCRONIZANDO EXACTAMENTE 1 CRÉDITO POR CADA ALUMNO DE PUBLIC.PROFILES ---');

  // 1. Obtener todos los perfiles ESTUDIANTE de Supabase
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('*')
    .eq('role', 'ESTUDIANTE')
    .order('nombres', { ascending: true });

  if (error || !profiles) {
    console.error('Error al obtener perfiles:', error);
    return;
  }

  console.log(`Se encontraron ${profiles.length} estudiantes en public.profiles.`);

  // 2. Limpiar la tabla public.pagos por completo
  await admin.from('pagos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await admin.from('audit_logs').delete().eq('accion', 'REGISTRO_CREDITOS_STUDENT');

  // 3. Crear 1 solo crédito (num_credito: 1) por cada alumno
  for (const p of profiles) {
    const dni = p.dni_ce;
    const paquete = p.paquete_adquirido || 'FULL';
    const esContado = String(paquete).includes('CONTADO') || p.tipo_pago === 'CONTADO';

    let montoTotal = Number(p.monto_total) || 0;
    let cuotas = ['0', '0', '0', 'no corresponde', 'no corresponde', 'no corresponde'];
    let totalPagado = 0;
    let totalDeuda = 0;

    // Asignación personalizada de cuotas según el plan del estudiante
    if (dni === '76789012') {
      // Andrea Sofía Gómez Salazar (ILIMITADO Cuotas - 6 x S/ 250 = 1500)
      montoTotal = 1500;
      cuotas = ['250', '250', '250', '0', '0', '0'];
      totalPagado = 750;
      totalDeuda = 750;
    } else if (dni === '75678901') {
      // Carlos Alberto Ríos Solís (ILIMITADO Contado - S/ 1500)
      montoTotal = 1500;
      cuotas = ['1500', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'];
      totalPagado = 1500;
      totalDeuda = 0;
    } else if (dni === '74567890') {
      // Fiorella Beatriz Chávez Paredes (FULL Cuotas - 6 x S/ 150 = 900)
      montoTotal = 900;
      cuotas = ['150', '150', '150', '150', '0', '0'];
      totalPagado = 600;
      totalDeuda = 300;
    } else if (dni === '73456789') {
      // Renzo Alexander Mendoza Alva (FULL Contado - S/ 900)
      montoTotal = 900;
      cuotas = ['900', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'];
      totalPagado = 900;
      totalDeuda = 0;
    } else if (dni === '72345678') {
      // Lucía María Fernández Vega (COMPLETO Cuotas - 3 x S/ 180 = 540)
      montoTotal = 540;
      cuotas = ['180', '180', '0', 'no corresponde', 'no corresponde', 'no corresponde'];
      totalPagado = 360;
      totalDeuda = 180;
    } else if (dni === '71234567') {
      // Juan Carlos Quispe Ramos (COMPLETO - 2 x S/ 135 = 270)
      montoTotal = 270;
      cuotas = ['135', '0', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'];
      totalPagado = 135;
      totalDeuda = 135;
    } else {
      // Demás alumnos en profiles (Roger Sanalea 77777777, Jorge Silva 33333333, Maria Roberta 22222222, etc.)
      montoTotal = montoTotal || (esContado ? 900 : 540);
      cuotas = esContado 
        ? ['0', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde']
        : ['0', '0', '0', 'no corresponde', 'no corresponde', 'no corresponde'];
      totalPagado = 0;
      totalDeuda = montoTotal;
    }

    const metadataMetodo = `CREDITO_1|${JSON.stringify({
      num_credito: 1,
      cuotas,
      total_pagado: totalPagado,
      total_deuda: totalDeuda
    })}`;

    const { data: newPago, error: insErr } = await admin.from('pagos').insert({
      profile_id: p.id,
      dni_ce: p.dni_ce,
      monto: montoTotal,
      metodo: metadataMetodo,
      estado: totalDeuda === 0 ? 'Completado' : 'Pendiente'
    }).select().single();

    if (insErr) {
      console.error(`❌ Error al crear crédito para ${p.nombres} (${p.dni_ce}):`, insErr.message);
      continue;
    }

    await admin.from('audit_logs').insert({
      usuario_email: 'admin@edumin.pe',
      accion: 'REGISTRO_CREDITOS_STUDENT',
      detalles: {
        pago_id: newPago.id,
        profile_id: p.id,
        dni_ce: p.dni_ce,
        num_credito: 1,
        monto: montoTotal,
        metodo: metadataMetodo,
        estado: newPago.estado,
        cuotas,
        total_pagado: totalPagado,
        total_deuda: totalDeuda
      }
    });

    console.log(`✅ 1 Crédito Único Creado para ${p.nombres} ${p.apellidos} (${p.dni_ce}) - Monto: S/ ${montoTotal}, Pagado: S/ ${totalPagado}, Deuda: S/ ${totalDeuda}`);
  }

  console.log('--- SINCRONIZACIÓN DE 1 CRÉDITO POR ALUMNO COMPLETADA CON ÉXITO ---');
}

syncSingleCredit();
