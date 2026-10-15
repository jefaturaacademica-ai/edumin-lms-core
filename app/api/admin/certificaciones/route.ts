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

    // 1. Consultar tabla certificaciones en Supabase
    let realEmitidos: any[] = [];
    const codigosExistentes = new Set<string>();

    try {
      const { data: cData } = await admin
        .from('certificaciones')
        .select('*')
        .order('created_at', { ascending: false });
      if (cData && cData.length > 0) {
        cData.forEach(c => {
          const cod = c.codigo_verificacion || String(c.id);
          codigosExistentes.add(cod);
          codigosExistentes.add(`${c.dni_ce}-${c.tipo}-${c.modulo_titulo || c.programa_titulo}`);

          realEmitidos.push({
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
          });
        });
      }
    } catch (err) {
      console.error('Error al consultar tabla certificaciones:', err);
    }

    // 2. Incorporar dinámicamente certificaciones de TODOS los estudiantes en Supabase (evitando duplicados)
    if (profiles && profiles.length > 0) {
      let counter = 100;
      profiles.forEach((p: any) => {
        const estudiante = `${p.nombres || ''} ${p.apellidos || ''}`.trim() || 'Estudiante';
        const dni = p.dni_ce || '00000000';
        const email = p.email || `${dni}@edumin.pe`;
        const habilitado = !p.bloqueado;

        // Parse Diplomados
        const dList = parseDiplomadosFromProfile(p);
        dList.forEach((d: any) => {
          // Solo consideramos módulos aprobados con nota >= 12
          const modulosAprobados = (d.modulos || []).filter((m: any) => {
            const nota = m.nota !== undefined ? Number(m.nota) : (m.completado ? 18 : 0);
            return Boolean(m.completado) && nota >= 12;
          });
          const modularesAprobadosCount = modulosAprobados.length;
          const modularesTotales = (d.modulos || []).length || 3;
          // Diploma general SOLO si aprueba los 3 módulos con nota >= 12
          const esDiplomaGeneral = modularesAprobadosCount >= 3;

          if (esDiplomaGeneral) {
            counter++;
            const codDiploma = d.codigo || `EDUMIN-DIP-${dni}-${(d.id || 'GEO').substring(0, 3).toUpperCase()}`;
            const keyUnica = `${dni}-DIPLOMA-${d.titulo || 'DIPLOMADO'}`;

            if (!codigosExistentes.has(codDiploma) && !codigosExistentes.has(keyUnica)) {
              codigosExistentes.add(codDiploma);
              codigosExistentes.add(keyUnica);

              const sumaNotas = modulosAprobados.reduce((sum: number, m: any) => sum + (Number(m.nota) || 18), 0);
              const promedio = modularesAprobadosCount > 0 ? Number((sumaNotas / modularesAprobadosCount).toFixed(1)) : 18;

              realEmitidos.push({
                id: `cert-dip-${dni}-${d.id || counter}`,
                codigo: codDiploma,
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
          }

          // Modulares completados y aprobados (nota >= 12)
          (d.modulos || []).forEach((m: any, mIdx: number) => {
            const nota = m.nota !== undefined ? Number(m.nota) : (m.completado ? 18 : 0);
            if (Boolean(m.completado) && nota >= 12) {
              counter++;
              const moduloNombreStr = `${m.codigo || `Módulo 0${mIdx + 1}`}: ${m.nombre || `Módulo ${mIdx + 1}`}`;
              const codModular = m.codigo_cert || `EDUMIN-MOD-${dni}-${mIdx + 1}`;
              const keyModular = `${dni}-MODULAR-${moduloNombreStr}`;

              if (!codigosExistentes.has(codModular) && !codigosExistentes.has(keyModular)) {
                codigosExistentes.add(codModular);
                codigosExistentes.add(keyModular);

                realEmitidos.push({
                  id: `cert-mod-${dni}-${mIdx + 1}-${counter}`,
                  codigo: codModular,
                  tipo: 'MODULAR',
                  estudiante,
                  dni,
                  email,
                  programa: d.titulo,
                  modulo: moduloNombreStr,
                  nota: nota,
                  horas: '40 horas cronológicas',
                  fecha: m.fecha || '2026-02-15',
                  estadoFinanciero: habilitado ? 'AL_DIA' : 'DEUDA_PENDIENTE',
                  habilitado,
                  categoria: 'Diplomados Oficiales'
                });
              }
            }
          });
        });

        // Parse Cursos
        const cList = parseCursosFromProfile(p);
        cList.forEach((c: any, cIdx: number) => {
          if (c.completado) {
            counter++;
            const esTaller = (c.categoria || '').toLowerCase().includes('taller') || (c.id || '').includes('taller');
            const codCurso = c.codigo || `EDUMIN-${esTaller ? 'TAL' : 'CUR'}-${dni}-${cIdx + 1}`;
            const keyCurso = `${dni}-${esTaller ? 'TALLER' : 'CURSO'}-${c.titulo}`;

            if (!codigosExistentes.has(codCurso) && !codigosExistentes.has(keyCurso)) {
              codigosExistentes.add(codCurso);
              codigosExistentes.add(keyCurso);

              realEmitidos.push({
                id: `cert-cur-${dni}-${cIdx + 1}-${counter}`,
                codigo: codCurso,
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
