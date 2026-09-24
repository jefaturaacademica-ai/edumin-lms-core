import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  return seedEstudiantes();
}

export async function POST() {
  return seedEstudiantes();
}

async function seedEstudiantes() {
  try {
    const admin = createAdminClient();

    // Definición de Alumnos Representativos por Paquete y Forma de Pago
    const alumnosSeed: any[] = [
      // 1. Paquete COMPLETO (Contado - S/ 540)
      {
        dni_ce: '71234567',
        nombres: 'Juan Carlos',
        apellidos: 'Quispe Ramos',
        email: 'jquispe.completo@edumin.pe',
        telefono: '+51 987654321',
        role: 'ESTUDIANTE',
        paquete_adquirido: 'COMPLETO',
        tipo_pago: 'CONTADO',
        cuotas_pagadas: 1,
        cuotas_totales: 1,
        monto_cuota: 540.00,
        monto_total: 540.00,
        diplomado_1: 'DIPLOMADO EN GESTIÓN DE SEGURIDAD Y SALUD EN EL TRABAJO',
        diplomado_2: null,
        nota_promedio: 17.8,
        avance_porcentaje: 100,
        dias_inactivo: 1,
        mes_inscripcion: 'septiembre',
        canal_adquisicion: 'Facebook Ads',
        pagos: [
          { monto: 540.00, metodo: 'Transferencia BCP', comprobante: 'OP-540101', nro_cuota: 'Cuota Única 100% Contado', concepto: 'Cuota Única 100% Contado', estado: 'Completado' }
        ]
      },

      // 2. Paquete COMPLETO (En Cuotas - 3 x S/ 180 = S/ 540)
      {
        dni_ce: '72345678',
        nombres: 'Lucía María',
        apellidos: 'Fernández Vega',
        email: 'lfernandez.cuotas@edumin.pe',
        telefono: '+51 976543210',
        role: 'ESTUDIANTE',
        paquete_adquirido: 'COMPLETO',
        tipo_pago: 'CUOTAS',
        cuotas_pagadas: 2,
        cuotas_totales: 3,
        monto_cuota: 180.00,
        monto_total: 540.00,
        diplomado_1: 'DIPLOMADO EN ADMINISTRACIÓN Y GESTIÓN PÚBLICA',
        diplomado_2: null,
        nota_promedio: 16.5,
        avance_porcentaje: 65,
        dias_inactivo: 2,
        mes_inscripcion: 'septiembre',
        canal_adquisicion: 'Google Ads',
        pagos: [
          { monto: 180.00, metodo: 'Yape / Plin', comprobante: 'OP-180101', nro_cuota: 'Cuota 1 de 3', concepto: 'Cuota 1 de 3', estado: 'Completado' },
          { monto: 180.00, metodo: 'Transferencia BCP', comprobante: 'OP-180102', nro_cuota: 'Cuota 2 de 3', concepto: 'Cuota 2 de 3', estado: 'Completado' }
        ]
      },

      // 3. Paquete FULL (Contado - S/ 900)
      {
        dni_ce: '73456789',
        nombres: 'Renzo Alexander',
        apellidos: 'Mendoza Alva',
        email: 'rmendoza.full@edumin.pe',
        telefono: '+51 965432109',
        role: 'ESTUDIANTE',
        paquete_adquirido: 'FULL',
        tipo_pago: 'CONTADO',
        cuotas_pagadas: 1,
        cuotas_totales: 1,
        monto_cuota: 900.00,
        monto_total: 900.00,
        diplomado_1: 'DIPLOMADO EN GESTIÓN Y OPERACIONES MINERAS',
        diplomado_2: null,
        nota_promedio: 18.2,
        avance_porcentaje: 100,
        dias_inactivo: 0,
        mes_inscripcion: 'septiembre',
        canal_adquisicion: 'TikTok Ads',
        pagos: [
          { monto: 900.00, metodo: 'Tarjeta BBVA', comprobante: 'OP-900201', nro_cuota: 'Cuota Única FULL Contado', concepto: 'Cuota Única FULL Contado', estado: 'Completado' }
        ]
      },

      // 4. Paquete FULL (En Cuotas - 6 x S/ 150 = S/ 900)
      {
        dni_ce: '74567890',
        nombres: 'Fiorella Beatriz',
        apellidos: 'Chávez Paredes',
        email: 'fchavez.fullcuotas@edumin.pe',
        telefono: '+51 954321098',
        role: 'ESTUDIANTE',
        paquete_adquirido: 'FULL',
        tipo_pago: 'CUOTAS',
        cuotas_pagadas: 4,
        cuotas_totales: 6,
        monto_cuota: 150.00,
        monto_total: 900.00,
        diplomado_1: 'DIPLOMADO EN INGENIERÍA DE MINAS Y MEDIO AMBIENTE',
        diplomado_2: null,
        nota_promedio: 16.8,
        avance_porcentaje: 70,
        dias_inactivo: 1,
        mes_inscripcion: 'septiembre',
        canal_adquisicion: 'WhatsApp / Wasapi',
        pagos: [
          { monto: 150.00, metodo: 'Yape / Plin', comprobante: 'OP-150201', nro_cuota: 'Cuota 1 de 6', concepto: 'Cuota 1 de 6', estado: 'Completado' },
          { monto: 150.00, metodo: 'Yape / Plin', comprobante: 'OP-150202', nro_cuota: 'Cuota 2 de 6', concepto: 'Cuota 2 de 6', estado: 'Completado' },
          { monto: 150.00, metodo: 'Transferencia BCP', comprobante: 'OP-150203', nro_cuota: 'Cuota 3 de 6', concepto: 'Cuota 3 de 6', estado: 'Completado' },
          { monto: 150.00, metodo: 'Tarjeta Interbank', comprobante: 'OP-150204', nro_cuota: 'Cuota 4 de 6', concepto: 'Cuota 4 de 6', estado: 'Completado' }
        ]
      },

      // 5. Paquete ILIMITADO (Contado - S/ 1500, 2 DIPLOMADOS SIMULTÁNEOS)
      {
        dni_ce: '75678901',
        nombres: 'Carlos Alberto',
        apellidos: 'Ríos Solís',
        email: 'crios.ilimitado@edumin.pe',
        telefono: '+51 943210987',
        role: 'ESTUDIANTE',
        paquete_adquirido: 'ILIMITADO',
        tipo_pago: 'CONTADO',
        cuotas_pagadas: 1,
        cuotas_totales: 1,
        monto_cuota: 1500.00,
        monto_total: 1500.00,
        diplomado_1: 'DIPLOMADO EN DERECHO MINERO Y AMBIENTAL',
        diplomado_2: 'DIPLOMADO EN GESTIÓN DE PROYECTOS MINEROS',
        nota_promedio: 18.5,
        avance_porcentaje: 90,
        dias_inactivo: 0,
        mes_inscripcion: 'septiembre',
        canal_adquisicion: 'Recomendación Directa',
        pagos: [
          { monto: 1500.00, metodo: 'Transferencia BCP', comprobante: 'OP-1500301', nro_cuota: 'Pago Único ILIMITADO 2 Años', concepto: 'Pago Único ILIMITADO 2 Años', estado: 'Completado' }
        ]
      },

      // 6. Paquete ILIMITADO (En Cuotas - 6 x S/ 250 = S/ 1500, 2 DIPLOMADOS SIMULTÁNEOS)
      {
        dni_ce: '76789012',
        nombres: 'Andrea Sofía',
        apellidos: 'Gómez Salazar',
        email: 'agomez.ilimitadocuotas@edumin.pe',
        telefono: '+51 932109876',
        role: 'ESTUDIANTE',
        paquete_adquirido: 'ILIMITADO',
        tipo_pago: 'CUOTAS',
        cuotas_pagadas: 3,
        cuotas_totales: 6,
        monto_cuota: 250.00,
        monto_total: 1500.00,
        diplomado_1: 'DIPLOMADO EN SEGURIDAD BASADA EN EL COMPORTAMIENTO',
        diplomado_2: 'DIPLOMADO EN MONITOREO Y EVALUACIÓN AMBIENTAL',
        nota_promedio: 17.4,
        avance_porcentaje: 55,
        dias_inactivo: 1,
        mes_inscripcion: 'septiembre',
        canal_adquisicion: 'LinkedIn Ads',
        pagos: [
          { monto: 250.00, metodo: 'Yape / Plin', comprobante: 'OP-250301', nro_cuota: 'Cuota 1 de 6', concepto: 'Cuota 1 de 6', estado: 'Completado' },
          { monto: 250.00, metodo: 'Transferencia BCP', comprobante: 'OP-250302', nro_cuota: 'Cuota 2 de 6', concepto: 'Cuota 2 de 6', estado: 'Completado' },
          { monto: 250.00, metodo: 'Yape / Plin', comprobante: 'OP-250303', nro_cuota: 'Cuota 3 de 6', concepto: 'Cuota 3 de 6', estado: 'Completado' }
        ]
      }
    ];

    const resultados = [];

    for (const data of alumnosSeed) {
      const { pagos: pagosData, ...profileFields } = data;

      // 1. Upsert en public.profiles
      const { data: profile, error: profileError } = await admin
        .from('profiles')
        .upsert(profileFields, { onConflict: 'dni_ce' })
        .select()
        .single();

      if (profileError) {
        console.error(`Error al insertar perfil ${data.dni_ce}:`, profileError);
        continue;
      }

      // 2. Limpiar e insertar pagos en public.pagos
      await admin.from('pagos').delete().eq('dni_ce', data.dni_ce);

      for (const p of pagosData) {
        await admin.from('pagos').insert({
          profile_id: profile.id,
          dni_ce: data.dni_ce,
          monto: p.monto,
          metodo: p.metodo,
          comprobante: p.comprobante,
          nro_cuota: p.nro_cuota,
          concepto: p.concepto,
          estado: p.estado
        });
      }

      resultados.push({ dni_ce: data.dni_ce, nombres: `${data.nombres} ${data.apellidos}`, paquete: data.paquete_adquirido, tipo: data.tipo_pago });
    }

    return NextResponse.json({
      success: true,
      message: 'Base de datos Supabase alimentada exitosamente con perfiles de prueba por paquete (Contado y Cuotas).',
      estudiantes_creados: resultados
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado al ejecutar seed' }, { status: 500 });
  }
}
