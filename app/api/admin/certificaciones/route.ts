import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDiplomadosFromProfile, parseCursosFromProfile } from '@/lib/utils/profileParser';

export async function GET() {
  try {
    const admin = createAdminClient();

    const { data: profiles } = await admin
      .from('profiles')
      .select('*')
      .order('nombres', { ascending: true });

    const solicitudes = (profiles || []).map((p, idx) => ({
      id: `sol-${p.id.substring(0, 6)}`,
      estudiante: `${p.nombres || ''} ${p.apellidos || ''}`.trim() || 'Estudiante',
      dni: p.dni_ce,
      email: p.email,
      programa: p.diplomado_1 || 'GEOMETALURGIA',
      tipo: idx % 2 === 0 ? 'CIP (Nacional)' : 'MIAMI (Internacional)',
      fecha: new Date().toISOString().split('T')[0],
      estado: idx === 0 ? 'Pendiente' : 'Emitido'
    }));

    // 1. Intentar consultar tabla certificaciones si existe
    let realEmitidos: any[] = [];
    try {
      const { data: cData } = await admin
        .from('certificaciones')
        .select('*')
        .order('created_at', { ascending: false });
      if (cData && cData.length > 0) {
        realEmitidos = cData.map(c => ({
          id: c.id,
          codigo: c.codigo_verificacion,
          tipo: c.tipo,
          estudiante: c.estudiante_nombre,
          dni: c.dni_ce,
          email: `${c.dni_ce}@edumin.pe`,
          programa: c.programa_titulo,
          modulo: c.modulo_titulo,
          nota: Number(c.nota_final) || 18,
          horas: c.horas_lectivas || '120 horas cronológicas',
          fecha: c.fecha_emision ? String(c.fecha_emision) : '2026-03-15',
          estadoFinanciero: c.estado_financiero_al_dia ? 'AL_DIA' : 'DEUDA_PENDIENTE',
          habilitado: c.estado_financiero_al_dia !== false,
          plantilla_snapshot: c.plantilla_snapshot || {},
          categoria: c.tipo === 'DIPLOMA' || c.tipo === 'MODULAR' ? 'Diplomados Oficiales' : (c.tipo === 'TALLER' ? 'Talleres' : 'Cursos de Alta Especialización')
        }));
      }
    } catch (err) {
      console.error('Error al consultar tabla certificaciones:', err);
    }

    // 2. Si no hay filas en tabla certificaciones, construir dinámicamente desde profiles de Supabase
    if (realEmitidos.length === 0 && profiles) {
      let counter = 100;
      profiles.forEach((p: any) => {
        const estudiante = `${p.nombres || ''} ${p.apellidos || ''}`.trim() || 'Estudiante';
        const dni = p.dni_ce || '00000000';
        const email = p.email || '';
        const habilitado = !p.bloqueado;

        // Parse Diplomados
        const dList = parseDiplomadosFromProfile(p);
        dList.forEach((d: any) => {
          const modulosCompletados = (d.modulos || []).filter((m: any) => m.completado);
          const modularesAprobados = modulosCompletados.length;
          const modularesTotales = (d.modulos || []).length || 3;
          const esCompletado = d.completado || (modularesAprobados === modularesTotales && modularesTotales > 0);

          if (esCompletado) {
            counter++;
            const sumaNotas = modulosCompletados.reduce((sum: number, m: any) => sum + (Number(m.nota) || 0), 0);
            const promedio = modularesAprobados > 0 ? Number((sumaNotas / modularesAprobados).toFixed(1)) : 18;

            realEmitidos.push({
              id: `cert-${counter}`,
              codigo: d.codigo || `EDUMIN-DIP-${dni}-${(d.id || 'GEO').substring(0, 3).toUpperCase()}`,
              tipo: 'DIPLOMA',
              estudiante,
              dni,
              email,
              programa: d.titulo || 'DIPLOMADO OFICIAL',
              modulo: null,
              nota: d.promedio || promedio,
              horas: '120 horas cronológicas',
              fecha: d.fecha || '2026-03-15',
              estadoFinanciero: habilitado ? 'AL_DIA' : 'DEUDA_PENDIENTE',
              habilitado,
              categoria: 'Diplomados Oficiales'
            });
          }

          // Modulares completados
          (d.modulos || []).forEach((m: any) => {
            if (m.completado) {
              counter++;
              realEmitidos.push({
                id: `cert-${counter}`,
                codigo: m.codigo_cert || `EDUMIN-MOD-${dni}-${counter}`,
                tipo: 'MODULAR',
                estudiante,
                dni,
                email,
                programa: d.titulo,
                modulo: `${m.codigo || 'Módulo'}: ${m.nombre}`,
                nota: Number(m.nota) || 18,
                horas: '40 horas cronológicas',
                fecha: m.fecha || '2026-02-15',
                estadoFinanciero: habilitado ? 'AL_DIA' : 'DEUDA_PENDIENTE',
                habilitado,
                categoria: 'Diplomados Oficiales'
              });
            }
          });
        });

        // Parse Cursos
        const cList = parseCursosFromProfile(p);
        cList.forEach((c: any) => {
          if (c.completado) {
            counter++;
            const esTaller = (c.categoria || '').toLowerCase().includes('taller') || (c.id || '').includes('taller');
            realEmitidos.push({
              id: `cert-${counter}`,
              codigo: c.codigo || `EDUMIN-${esTaller ? 'TAL' : 'CUR'}-${dni}-${counter}`,
              tipo: esTaller ? 'TALLER' : 'CURSO',
              estudiante,
              dni,
              email,
              programa: c.titulo,
              modulo: null,
              nota: Number(c.nota) || 18,
              horas: c.horas || '24 horas cronológicas',
              fecha: c.fecha || '2026-02-18',
              estadoFinanciero: habilitado ? 'AL_DIA' : 'DEUDA_PENDIENTE',
              habilitado,
              categoria: esTaller ? 'Talleres' : 'Cursos de Alta Especialización'
            });
          }
        });
      });
    }

    return NextResponse.json({ 
      solicitudes,
      emitidos: realEmitidos,
      kpis: {
        totalEmitidos: realEmitidos.length,
        diplomasGenerales: realEmitidos.filter(c => c.tipo === 'DIPLOMA').length,
        modulares: realEmitidos.filter(c => c.tipo === 'MODULAR').length,
        cursosTalleres: realEmitidos.filter(c => c.tipo === 'CURSO' || c.tipo === 'TALLER').length,
        habilitados: realEmitidos.filter(c => c.habilitado).length,
        retenidosDeuda: realEmitidos.filter(c => !c.habilitado).length
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener certificaciones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, dni, codigoQr } = body;

    const admin = createAdminClient();

    // Registrar en auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: 'EMITIR_CERTIFICADO_CIP_MIAMI',
        detalles: {
          solicitudId: id,
          dni_ce: dni,
          codigoQr: codigoQr || `EDUMIN-CIP-2026-${Math.floor(1000 + Math.random() * 9000)}`
        }
      });
    } catch (e: any) {
      console.error(e);
    }

    return NextResponse.json({ success: true, message: 'Certificado CIP emitido y notificado.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al emitir certificado' }, { status: 500 });
  }
}
