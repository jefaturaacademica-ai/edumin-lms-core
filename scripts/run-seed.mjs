import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function seed() {
  console.log('--- ALIMENTANDO BASE DE DATOS SUPABASE CON ESTUDIANTES Y PAGOS ---');

  const alumnosSeed = [
    // 1. COMPLETO (Contado - S/ 540)
    {
      dni_ce: '71234567',
      nombres: 'Juan Carlos',
      apellidos: 'Quispe Ramos',
      email: 'jquispe.completo@edumin.pe',
      telefono: '+51 987654321',
      role: 'ESTUDIANTE',
      paquete_adquirido: 'COMPLETO',
      cuotas_pagadas: 1,
      cupos_diplomados: 1,
      bloqueado: false,
      diplomado_1: 'DIPLOMADO EN GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO',
      diplomado_2: null,
      pagos: [
        { monto: 540.00, metodo: 'Transferencia BCP', estado: 'Completado' }
      ]
    },

    // 2. COMPLETO (Cuotas - 3 x S/ 180 = S/ 540)
    {
      dni_ce: '72345678',
      nombres: 'Lucía María',
      apellidos: 'Fernández Vega',
      email: 'lfernandez.cuotas@edumin.pe',
      telefono: '+51 976543210',
      role: 'ESTUDIANTE',
      paquete_adquirido: 'COMPLETO',
      cuotas_pagadas: 2,
      cupos_diplomados: 1,
      bloqueado: false,
      diplomado_1: 'DIPLOMADO EN ADMINISTRACIÓN Y GESTIÓN PÚBLICA',
      diplomado_2: null,
      pagos: [
        { monto: 180.00, metodo: 'Yape / Plin', estado: 'Completado' },
        { monto: 180.00, metodo: 'Transferencia BCP', estado: 'Completado' }
      ]
    },

    // 3. FULL (Contado - S/ 900)
    {
      dni_ce: '73456789',
      nombres: 'Renzo Alexander',
      apellidos: 'Mendoza Alva',
      email: 'rmendoza.full@edumin.pe',
      telefono: '+51 965432109',
      role: 'ESTUDIANTE',
      paquete_adquirido: 'FULL',
      cuotas_pagadas: 1,
      cupos_diplomados: 1,
      bloqueado: false,
      diplomado_1: 'DIPLOMADO EN GESTIÓN Y OPERACIONES MINERAS',
      diplomado_2: null,
      pagos: [
        { monto: 900.00, metodo: 'Tarjeta BBVA', estado: 'Completado' }
      ]
    },

    // 4. FULL (Cuotas - 6 x S/ 150 = S/ 900)
    {
      dni_ce: '74567890',
      nombres: 'Fiorella Beatriz',
      apellidos: 'Chávez Paredes',
      email: 'fchavez.fullcuotas@edumin.pe',
      telefono: '+51 954321098',
      role: 'ESTUDIANTE',
      paquete_adquirido: 'FULL',
      cuotas_pagadas: 4,
      cupos_diplomados: 1,
      bloqueado: false,
      diplomado_1: 'DIPLOMADO EN INGENIERÍA DE MINAS Y MEDIO AMBIENTE',
      diplomado_2: null,
      pagos: [
        { monto: 150.00, metodo: 'Yape / Plin', estado: 'Completado' },
        { monto: 150.00, metodo: 'Yape / Plin', estado: 'Completado' },
        { monto: 150.00, metodo: 'Transferencia BCP', estado: 'Completado' },
        { monto: 150.00, metodo: 'Tarjeta Interbank', estado: 'Completado' }
      ]
    },

    // 5. ILIMITADO (Contado - S/ 1500, 2 DIPLOMADOS SIMULTÁNEOS)
    {
      dni_ce: '75678901',
      nombres: 'Carlos Alberto',
      apellidos: 'Ríos Solís',
      email: 'crios.ilimitado@edumin.pe',
      telefono: '+51 943210987',
      role: 'ESTUDIANTE',
      paquete_adquirido: 'ILIMITADO',
      cuotas_pagadas: 1,
      cupos_diplomados: 5,
      bloqueado: false,
      diplomado_1: 'DIPLOMADO EN DERECHO MINERO Y AMBIENTAL',
      diplomado_2: 'DIPLOMADO EN GESTIÓN DE PROYECTOS MINEROS',
      pagos: [
        { monto: 1500.00, metodo: 'Transferencia BCP', estado: 'Completado' }
      ]
    },

    // 6. ILIMITADO (Cuotas - 6 x S/ 250 = S/ 1500, 2 DIPLOMADOS SIMULTÁNEOS)
    {
      dni_ce: '76789012',
      nombres: 'Andrea Sofía',
      apellidos: 'Gómez Salazar',
      email: 'agomez.ilimitadocuotas@edumin.pe',
      telefono: '+51 932109876',
      role: 'ESTUDIANTE',
      paquete_adquirido: 'ILIMITADO',
      cuotas_pagadas: 3,
      cupos_diplomados: 5,
      bloqueado: false,
      diplomado_1: 'DIPLOMADO EN SEGURIDAD BASADA EN EL COMPORTAMIENTO',
      diplomado_2: 'DIPLOMADO EN MONITOREO Y EVALUACIÓN AMBIENTAL',
      pagos: [
        { monto: 250.00, metodo: 'Yape / Plin', estado: 'Completado' },
        { monto: 250.00, metodo: 'Transferencia BCP', estado: 'Completado' },
        { monto: 250.00, metodo: 'Yape / Plin', estado: 'Completado' }
      ]
    }
  ];

  for (const data of alumnosSeed) {
    const { pagos: pagosData, ...profileFields } = data;

    // Upsert profile in Supabase
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .upsert(profileFields, { onConflict: 'dni_ce' })
      .select()
      .single();

    if (profileError) {
      console.error(`❌ Error en perfil ${data.dni_ce}:`, profileError.message);
      continue;
    }

    console.log(`✅ Perfil Insertado/Actualizado en Supabase: ${profile.nombres} ${profile.apellidos} (${profile.paquete_adquirido})`);

    // Clear & insert pagos in public.pagos
    await admin.from('pagos').delete().eq('dni_ce', data.dni_ce);

    for (const p of pagosData) {
      const { error: pagoError } = await admin.from('pagos').insert({
        profile_id: profile.id,
        dni_ce: data.dni_ce,
        monto: p.monto,
        metodo: p.metodo,
        estado: p.estado
      });
      if (pagoError) {
        console.error(`   ❌ Error en pago:`, pagoError.message);
      } else {
        console.log(`   💳 Pago Registrado en public.pagos: S/ ${p.monto} (${p.metodo})`);
      }
    }
  }

  console.log('--- SEED COMPLETADO CON ÉXITO EN SUPABASE ---');
}

seed();
