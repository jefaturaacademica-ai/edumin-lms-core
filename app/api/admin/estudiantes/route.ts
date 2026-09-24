import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    
    // Consultar solo perfiles con rol ESTUDIANTE de Supabase
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('*')
      .eq('role', 'ESTUDIANTE')
      .order('nombres', { ascending: true });

    if (error) {
      console.error('Error al consultar profiles:', error);
      return NextResponse.json({ estudiantes: [], error: error.message }, { status: 500 });
    }

    // Consultar historial de pagos registrados en Supabase
    const { data: pagos } = await admin
      .from('pagos')
      .select('*')
      .order('created_at', { ascending: false });

    // Mapear campos para el Dashboard 360° y Alumnos en Riesgo
    const estudiantes = (profiles || []).map((p: any) => {
      const cuotasPagadas = p.cuotas_pagadas ?? 0;
      const esContado = String(p.paquete_adquirido || '').includes('CONTADO') || p.tipo_pago === 'CONTADO';
      
      const cuotasTotales = p.cuotas_totales ?? (esContado ? 1 : (p.paquete_adquirido === 'ILIMITADO' ? 6 : p.paquete_adquirido === 'FULL' ? 6 : 3));
      const montoCuota = Number(p.monto_cuota) || (esContado ? (p.monto_total || 540.00) : (p.paquete_adquirido === 'ILIMITADO' ? 250.00 : p.paquete_adquirido === 'FULL' ? 150.00 : 180.00));
      const montoTotalPrograma = Number(p.monto_total) || (cuotasTotales * montoCuota);
      const montoTotalPagado = Math.min(montoTotalPrograma, cuotasPagadas * montoCuota);
      const cuotasPendientes = Math.max(0, cuotasTotales - cuotasPagadas);
      const deudaTotalPendiente = Math.max(0, montoTotalPrograma - montoTotalPagado);

      // Historial de pagos reales asociados a este DNI o ID de perfil
      const pagosAlumno = (pagos || []).filter((pag: any) => pag.profile_id === p.id || pag.dni_ce === p.dni_ce);

      // Cálculo de estado financiero
      let estado = 'Al Día';
      if (deudaTotalPendiente === 0 || (esContado && cuotasPagadas >= 1)) {
        estado = 'Constancia de no adeudo';
      } else if (p.bloqueado) {
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
        paquete_adquirido: p.paquete_adquirido || 'FULL',
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
        diplomado_2: p.diplomado_2 || null,
        avance_porcentaje: p.avance_porcentaje ?? (p.paquete_adquirido === 'ILIMITADO' ? 85 : p.paquete_adquirido === 'FULL' ? 65 : 40),
        nota_promedio: p.nota_promedio ?? 17.2,
        ultima_conexion: p.ultima_conexion || 'Hace 1 hora',
        dias_inactivo: p.dias_inactivo ?? (p.bloqueado ? 14 : 1),
        mes_inscripcion: p.mes_inscripcion || 'septiembre',
        canal_adquisicion: p.canal_adquisicion || 'Facebook Ads',
        historial_pagos: pagosAlumno
      };
    });

    return NextResponse.json({ estudiantes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener estudiantes' }, { status: 500 });
  }
}
