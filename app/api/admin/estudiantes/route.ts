import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    
    // Consultar todos los perfiles de Supabase
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('*')
      .order('nombres', { ascending: true });

    if (error) {
      console.error('Error al consultar profiles:', error);
      return NextResponse.json({ estudiantes: [], error: error.message }, { status: 500 });
    }

    // Mapear campos para el Dashboard 360° y Alumnos en Riesgo
    const estudiantes = (profiles || []).map((p: any) => {
      const cuotasPagadas = p.cuotas_pagadas || 0;
      const cuotasTotales = p.paquete_adquirido === 'ILIMITADO' ? 12 : p.paquete_adquirido === 'FULL' ? 6 : 3;
      const montoCuota = 150.00;
      const montoTotalPagado = cuotasPagadas * montoCuota;
      const cuotasPendientes = Math.max(0, cuotasTotales - cuotasPagadas);
      const deudaTotalPendiente = cuotasPendientes * montoCuota;

      // Cálculo de estado financiero
      let estado = 'Al Día';
      if (p.bloqueado) {
        estado = 'Bloqueado por Sistema';
      } else if (p.prorroga_hasta) {
        const fechaProrroga = new Date(p.prorroga_hasta);
        const hoy = new Date();
        estado = fechaProrroga >= hoy ? 'Prórroga Activa' : 'Prórroga Vencida';
      } else if (cuotasPendientes > 0) {
        estado = 'Deuda Activa';
      }

      // Nivel de riesgo churn estimado
      let nivelRiesgoChurn = 'BAJO';
      if (p.bloqueado || estado === 'Prórroga Vencida') {
        nivelRiesgoChurn = 'CRÍTICO';
      } else if (cuotasPendientes >= 2) {
        nivelRiesgoChurn = 'ALTO';
      } else if (cuotasPendientes === 1) {
        nivelRiesgoChurn = 'MEDIO';
      }

      return {
        id: p.id,
        dni_ce: p.dni_ce,
        nombres: p.nombres,
        apellidos: p.apellidos,
        email: p.email,
        telefono: p.telefono || 'Sin teléfono',
        role: p.role,
        paquete_adquirido: p.paquete_adquirido,
        cuotas_pagadas: cuotasPagadas,
        cuotas_totales: cuotasTotales,
        monto_cuota: montoCuota,
        monto_total_pagado: montoTotalPagado,
        deuda_total_pendiente: deudaTotalPendiente,
        cuotas_pendientes: cuotasPendientes,
        estado,
        bloqueado: Boolean(p.bloqueado),
        prorroga_hasta: p.prorroga_hasta || null,
        nivel_riesgo_churn: nivelRiesgoChurn,
        diplomado_actual: p.diplomado_1 || 'DIPLOMADO EN GESTIÓN MINERA',
        avance_porcentaje: p.paquete_adquirido === 'ILIMITADO' ? 85 : p.paquete_adquirido === 'FULL' ? 60 : 40,
        nota_promedio: 16.5,
        ultima_conexion: 'Hace 2 horas',
        dias_inactivo: p.bloqueado ? 14 : 1,
        mes_inscripcion: 'septiembre',
        canal_adquisicion: 'Facebook Ads'
      };
    });

    return NextResponse.json({ estudiantes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener estudiantes' }, { status: 500 });
  }
}
