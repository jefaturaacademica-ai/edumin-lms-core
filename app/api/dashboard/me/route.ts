import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateEduminCredits, derivePaymentStateForCredits } from '@/lib/utils/credits';
import {
  parseDiplomadosFromProfile,
  parseCursosFromProfile,
  parseCuposCreditosFromProfile,
  getPrimaryRoleFromProfile,
  filtrarCursosReales
} from '@/lib/utils/profileParser';
import { getDiplomadoByTitleOrSlug } from '@/lib/data/diplomadosData';
import { obtenerTallerParaDiplomado } from '@/lib/utils/tallerAsignado';
import { calcularFechasVencimientoPorDefecto } from '@/lib/utils/fechasCuotas';

async function resolverFotoPerfil(admin: any, profile: any): Promise<string | null> {
  if (!profile) return null;
  let foto: string | null = profile.foto_perfil || profile.avatar_url || null;
  if (foto) return foto;

  const profileId = profile.id;
  if (!profileId) return null;

  try {
    // 1. Buscar si existe avatar en la carpeta del usuario en Supabase Storage (avatars/<id>/*)
    const { data: avatarFiles } = await admin.storage
      .from('avatars')
      .list(profileId)
      .catch(() => ({ data: [] }));

    if (avatarFiles && avatarFiles.length > 0) {
      const avatarFile = avatarFiles.find((f: any) => f.name && f.name.includes('avatar')) || avatarFiles[0];
      const { data: urlData } = admin.storage
        .from('avatars')
        .getPublicUrl(`${profileId}/${avatarFile.name}`);
      if (urlData?.publicUrl) {
        foto = `${urlData.publicUrl}?v=${Date.now()}`;
      }
    } else {
      // 2. Buscar en la raíz del bucket si coincide con el profileId
      const { data: rootFiles } = await admin.storage
        .from('avatars')
        .list('', { search: profileId })
        .catch(() => ({ data: [] }));
      if (rootFiles && rootFiles.length > 0) {
        const { data: urlData } = admin.storage
          .from('avatars')
          .getPublicUrl(rootFiles[0].name);
        if (urlData?.publicUrl) {
          foto = `${urlData.publicUrl}?v=${Date.now()}`;
        }
      }
    }

    // Si se recuperó desde Storage, sincronizar en el perfil para futuras consultas rápidas
    if (foto) {
      await admin
        .from('profiles')
        .update({ foto_perfil: foto, avatar_url: foto })
        .eq('id', profileId)
        .catch(() => {});
    }
  } catch (err) {
    console.warn('Advertencia resolviendo foto de perfil en Storage:', err);
  }

  return foto;
}

function parseCreditoRow(pag: any) {
  const nro_recibo = pag.nro_recibo || undefined;
  const nro_operacion = pag.nro_operacion || undefined;
  const comprobante = pag.comprobante || undefined;

  if (typeof pag.metodo === 'string' && pag.metodo.startsWith('CARGO_EXTRA|')) {
    const concepto = pag.metodo.replace('CARGO_EXTRA|', '');
    return {
      id: pag.id,
      profile_id: pag.profile_id,
      dni_ce: pag.dni_ce,
      is_cargo_extra: true,
      concepto,
      nro_cuota: `Cargo Extra (${concepto})`,
      num_credito: 99,
      nro_recibo,
      nro_operacion,
      comprobante,
      monto: Number(pag.monto || 0),
      metodo: 'Yape / Plin',
      estado: pag.estado || 'APROBADO',
      created_at: pag.created_at,
      cuotas: [],
      total_pagado: Number(pag.monto || 0),
      total_deuda: 0
    };
  }

  let num_credito = pag.num_credito || 1;
  let cuotas = [
    pag.cuota_01 || pag['cuota 01'] || '0',
    pag.cuota_02 || pag['cuota 02'] || 'no corresponde',
    pag.cuota_03 || pag['cuota 03'] || 'no corresponde',
    pag.cuota_04 || pag['cuota 04'] || 'no corresponde',
    pag.cuota_05 || pag['cuota 05'] || 'no corresponde',
    pag.cuota_06 || pag['cuota 06'] || 'no corresponde'
  ];
  let total_pagado = Number(pag.total_pagado || pag['total pagado'] || 0);
  let explicitDeuda: number | undefined = undefined;
  let cuotas_recibos: Record<number, { nro_recibo?: string; nro_operacion?: string; fecha?: string }> = {};
  let fechas_vencimiento: string[] | null = null;
  let rowNroRecibo = nro_recibo;
  let rowNroOperacion = nro_operacion;
  let rowComprobante = comprobante;
  let nro_pagare = pag.nro_pagare || undefined;
  let ultimoMetodo = 'Yape / Plin';

  if (typeof pag.metodo === 'string' && pag.metodo.startsWith('CREDITO_')) {
    try {
      const jsonStr = pag.metodo.substring(pag.metodo.indexOf('|') + 1).trim();
      const parsed = JSON.parse(jsonStr);
      num_credito = parsed.num_credito || num_credito;
      if (parsed.nro_pagare) nro_pagare = parsed.nro_pagare;
      if (parsed.cuotas_recibos && typeof parsed.cuotas_recibos === 'object') {
        cuotas_recibos = { ...parsed.cuotas_recibos };
      }
      if (Array.isArray(parsed.fechas_vencimiento)) {
        fechas_vencimiento = parsed.fechas_vencimiento;
      }
      if (parsed.ultimo_pago?.metodo && parsed.ultimo_pago.metodo !== 'Por Pagar') {
        ultimoMetodo = parsed.ultimo_pago.metodo;
      } else if (parsed.metodo && parsed.metodo !== 'Por Pagar') {
        ultimoMetodo = parsed.metodo;
      }
      if (parsed.ultimo_pago?.nro_recibo) rowNroRecibo = parsed.ultimo_pago.nro_recibo;
      if (parsed.ultimo_pago?.nro_operacion) rowNroOperacion = parsed.ultimo_pago.nro_operacion;
      if (parsed.ultimo_pago?.comprobante) rowComprobante = parsed.ultimo_pago.comprobante;
      if (Array.isArray(parsed.cuotas)) {
        cuotas = parsed.cuotas;
      }
      if (parsed.total_pagado !== undefined) {
        total_pagado = Number(parsed.total_pagado);
      }
      if (parsed.total_deuda !== undefined) {
        explicitDeuda = Number(parsed.total_deuda);
      }
    } catch {
      // ignore
    }
  }

  const cuotasActivasTotal = cuotas.filter(c => c !== 'no corresponde').length;
  if (!fechas_vencimiento || fechas_vencimiento.length === 0) {
    fechas_vencimiento = calcularFechasVencimientoPorDefecto(pag.created_at, Math.max(1, cuotasActivasTotal));
  }

  const metodoResolved = pag.metodo && !pag.metodo.startsWith('CREDITO_') && pag.metodo !== 'Por Pagar'
    ? pag.metodo
    : (ultimoMetodo || 'Yape / Plin');

  if (Array.isArray(cuotas)) {
    const sumCuotasPagadas = cuotas.reduce((sum: number, val: string) => {
      return val !== 'no corresponde' ? sum + (Number(val) || 0) : sum;
    }, 0);
    if (sumCuotasPagadas > 0 || total_pagado === 0) {
      total_pagado = sumCuotasPagadas;
    }

    // Asegurar fecha y método para cuotas pagadas
    cuotas.forEach((val, idx) => {
      if (val !== 'no corresponde' && Number(val) > 0) {
        if (!cuotas_recibos[idx]) {
          cuotas_recibos[idx] = {
            nro_recibo: rowNroRecibo || null,
            nro_operacion: rowNroOperacion || 'N/A',
            fecha: pag.created_at
          };
        } else if (!cuotas_recibos[idx].fecha) {
          cuotas_recibos[idx].fecha = pag.created_at;
        }
      }
    });
  }

  const cuotasActivas = Array.isArray(cuotas) ? cuotas.filter(c => c !== 'no corresponde') : [];
  const cuotasNoPagadas = cuotasActivas.filter(c => Number(c) === 0);
  const cuotasPagadas = cuotasActivas.filter(c => Number(c) > 0);

  let total_deuda = explicitDeuda !== undefined
    ? explicitDeuda
    : Math.max(0, Number(pag.monto || 0) - total_pagado);

  // Si hay cuotas activas pendientes de pago (con valor 0) y total_deuda dio 0, calcular la deuda real pendiente
  if (cuotasNoPagadas.length > 0 && total_deuda === 0) {
    const montoCuotaEst = cuotasPagadas.length > 0
      ? (total_pagado / cuotasPagadas.length)
      : (Number(pag.monto || 0) / Math.max(1, cuotasActivas.length));
    total_deuda = Math.round(montoCuotaEst * cuotasNoPagadas.length);
  }

  const montoTotal = Math.max(Number(pag.monto || 0), total_pagado + total_deuda);

  return {
    id: pag.id,
    profile_id: pag.profile_id,
    dni_ce: pag.dni_ce,
    num_credito,
    nro_pagare,
    nro_recibo: rowNroRecibo,
    nro_operacion: rowNroOperacion,
    comprobante: rowComprobante,
    cuotas_recibos,
    fechas_vencimiento,
    monto: montoTotal,
    metodo: metodoResolved,
    estado: total_deuda === 0 ? 'Completado' : (pag.estado || 'Pendiente'),
    created_at: pag.created_at,
    cuotas,
    total_pagado,
    total_deuda
  };
}

let cachedDiplomadosYCursos: { rows: any[]; timestamp: number } | null = null;
const CAT_TABLE_TTL = 3 * 60 * 1000;

async function getCachedDiplomadosYCursos(admin: any) {
  if (cachedDiplomadosYCursos && Date.now() - cachedDiplomadosYCursos.timestamp < CAT_TABLE_TTL) {
    return cachedDiplomadosYCursos.rows;
  }
  const { data } = await admin.from('diplomados_y_cursos').select('id, codigo, titulo, tipo');
  const rows = Array.isArray(data) ? data : [];
  cachedDiplomadosYCursos = { rows, timestamp: Date.now() };
  return rows;
}

async function enriquecerCursosConTipoCatalogo(admin: any, cursos: any[]) {
  if (!Array.isArray(cursos) || cursos.length === 0) return cursos;
  const catRows = await getCachedDiplomadosYCursos(admin);

  if (!Array.isArray(catRows) || catRows.length === 0) return cursos;

  const porClave = new Map<string, any>();
  catRows.forEach((r: any) => {
    if (r.id) porClave.set(String(r.id).trim().toLowerCase(), r);
    if (r.codigo) porClave.set(String(r.codigo).trim().toLowerCase(), r);
    if (r.titulo) porClave.set(String(r.titulo).trim().toLowerCase(), r);
  });

  return cursos.map((c: any) => {
    if (!c) return c;
    const match =
      porClave.get(String(c.id || '').trim().toLowerCase()) ||
      porClave.get(String(c.codigo || '').trim().toLowerCase()) ||
      porClave.get(String(c.titulo || '').trim().toLowerCase());

    if (!match?.tipo) return c;
    const tipoNorm = String(match.tipo).toUpperCase();
    const esTallerDb = tipoNorm === 'TALLER';
    return {
      ...c,
      tipo: esTallerDb ? 'TALLER' : tipoNorm,
      ...(esTallerDb ? { esRegalo: true } : {}),
    };
  });
}

async function enriquecerConNotasModulos(
  admin: any,
  dniCe: string | null | undefined,
  diplomados: any[],
  cursos: any[]
) {
  const dni = String(dniCe || '').trim();
  if (!dni) return;

  try {
    const [{ data: notasRows }, catRows] = await Promise.all([
      admin
        .from('notas_modulos')
        .select('diplomado_numero, diplomado_nombre, tipo_programa, modulo_numero, modulo_nombre, nota, estado, updated_at')
        .eq('dni_ce', dni)
        .order('updated_at', { ascending: false }),
      getCachedDiplomadosYCursos(admin)
    ]);

    if (!Array.isArray(notasRows) || notasRows.length === 0) return;

    const norm = (s?: string) =>
      String(s || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/^diplomado\s+(en\s+)?/i, '')
        .replace(/[^a-z0-9]/g, '');

    const catPorClave = new Map<string, any>();
    (catRows || []).forEach((r: any) => {
      if (r.id) catPorClave.set(norm(r.id), r);
      if (r.codigo) catPorClave.set(norm(r.codigo), r);
      if (r.titulo) catPorClave.set(norm(r.titulo), r);
    });

    // Enriquecer módulos de diplomados desde notas_modulos
    diplomados.forEach((d: any) => {
      const cat = catPorClave.get(norm(d.codigo)) || catPorClave.get(norm(d.slug)) || catPorClave.get(norm(d.id)) || catPorClave.get(norm(d.titulo));
      if (!d.codigo && cat?.codigo) d.codigo = cat.codigo;
      const dipCodNorm = norm(d.codigo || cat?.codigo);
      const dipTitNorm = norm(d.titulo);

      if (Array.isArray(d.modulos)) {
        d.modulos.forEach((m: any, mIdx: number) => {
          const modNum = mIdx + 1;
          const modKeyNorm = norm(m.codigo || m.id);
          const match = notasRows.find((n: any) => {
            const tipo = String(n.tipo_programa || '').toLowerCase();
            const numUpper = String(n.diplomado_numero || '').toUpperCase();
            if (tipo && tipo !== 'diplomado' && !numUpper.startsWith('DIP')) return false;
            const matchDip =
              (dipCodNorm && norm(n.diplomado_numero) === dipCodNorm) ||
              (dipTitNorm && norm(n.diplomado_nombre) === dipTitNorm);
            if (!matchDip) return false;
            return (
              Number(n.modulo_numero) === modNum ||
              (modKeyNorm && norm(n.modulo_nombre) === modKeyNorm)
            );
          });
          if (match) {
            m.nota = Number(match.nota ?? m.nota ?? 0);
            m.rendido = true;
            m.completado = Boolean(m.completado || match.estado === 'APROBADO');
            if (match.updated_at) {
              m.fecha_examen = match.updated_at;
              if (!m.fecha) {
                m.fecha = String(match.updated_at).split('T')[0];
              }
            }
          }
        });
      }
    });

    // Enriquecer cursos/talleres desde notas_modulos
    const extraerCodigoCurso = (str?: string) => {
      const m = String(str || '').match(/(?:^|[^a-z0-9])(cur|tal)[-_]?0*(\d+)/i);
      return m ? `${m[1].toLowerCase()}${m[2].padStart(2, '0')}` : null;
    };

    cursos.forEach((c: any) => {
      const cCodSimple = extraerCodigoCurso(c.codigo) || extraerCodigoCurso(c.id);
      const cat = catPorClave.get(norm(c.codigo)) || 
                  catPorClave.get(norm(c.id)) || 
                  catPorClave.get(norm(c.titulo)) ||
                  (cCodSimple ? catPorClave.get(cCodSimple) : null);

      if (!c.codigo && cat?.codigo) c.codigo = cat.codigo;
      const catCodSimple = extraerCodigoCurso(cat?.codigo) || extraerCodigoCurso(cat?.id);

      const keys = [
        cCodSimple,
        catCodSimple,
        norm(c.codigo),
        norm(c.id),
        norm(cat?.codigo),
        norm(cat?.id),
        norm(c.titulo),
        norm(cat?.titulo)
      ].filter(Boolean);

      const match = notasRows.find((n: any) => {
        const nNumNorm = norm(n.diplomado_numero);
        const nNumSimple = extraerCodigoCurso(n.diplomado_numero);
        const nTitNorm = norm(n.diplomado_nombre);
        const nModNorm = norm(n.modulo_nombre);

        if (nNumSimple && (nNumSimple === cCodSimple || nNumSimple === catCodSimple)) return true;
        if (nNumNorm && keys.includes(nNumNorm)) return true;
        if (nTitNorm && nTitNorm !== 'diplomado' && nTitNorm !== 'curso' && nTitNorm !== 'taller' && keys.includes(nTitNorm)) return true;
        if (nModNorm && (nModNorm === norm(c.titulo) || nModNorm === norm(c.codigo))) return true;
        return false;
      });

      if (match) {
        c.nota = Number(match.nota ?? c.nota ?? 0);
        c.rendido = true;
        c.completado = Boolean(c.completado || match.estado === 'APROBADO');
        if (match.updated_at) {
          c.fecha_examen = match.updated_at;
          if (!c.fecha) {
            c.fecha = String(match.updated_at).split('T')[0];
          }
        }
      }
    });
  } catch (err) {
    console.warn('No se pudo enriquecer perfil con notas_modulos:', err);
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Obtener Perfil del estudiante (por ID o por Email)
    let { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile && user.email) {
      const { data: pByEmail } = await admin
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();
      profile = pByEmail;
    }

    if (!profile) {
      return NextResponse.json({ error: 'Perfil de estudiante no encontrado en Supabase.' }, { status: 404 });
    }

    const docNum = profile.numero_documento || profile.dni_ce || '';
    profile.dni_ce = docNum;

    // 2. Obtener Pagos del estudiante buscando coincidencia por profile_id, dni_ce en pagos o coincidencia de documento en metodo
    let rawPagos: any[] = [];
    if (docNum) {
      const { data: pData } = await admin
        .from('pagos')
        .select('*')
        .or(`profile_id.eq.${profile.id},dni_ce.eq.${docNum},metodo.ilike.%${docNum}%`)
        .order('created_at', { ascending: true });
      rawPagos = pData || [];
    } else {
      const { data: pData } = await admin
        .from('pagos')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: true });
      rawPagos = pData || [];
    }

    const parsedPagos = rawPagos.map(p => parseCreditoRow(p));

    // 3. Las matrículas viven centralizadas en `profiles.diplomados` y `profiles.cursos`
    const matriculasData: any[] = [];

    const esAdmin = Boolean(profile.roles?.administrativo);
    if (esAdmin) {
      profile.paquete_adquirido = profile.paquete_adquirido || 'FULL';
      profile.cuotas_pagadas = profile.cuotas_pagadas || 6;
      profile.bloqueado = false;
    }

    let diplomados_json = parseDiplomadosFromProfile(profile);
    if (esAdmin && diplomados_json.length === 0) {
      const defaultDip = getDiplomadoByTitleOrSlug(profile.diplomado_1 || 'derecho-minero');
      diplomados_json = [{
        id: defaultDip.slug,
        slug: defaultDip.slug,
        titulo: defaultDip.titulo,
        avance: 0,
        modulos: defaultDip.modulos.map((m: any, mIdx: number) => ({
          id: m.codigo || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`,
          codigo: m.codigo || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`,
          nombre: m.nombre || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`,
          nota: 0,
          completado: false
        }))
      }];
    }
    let cursos_json = parseCursosFromProfile(profile);

    const dipTitulosProfile: string[] = [];
    diplomados_json.forEach((d: any) => {
      const t = d.titulo || d.slug;
      if (t && !dipTitulosProfile.includes(t)) dipTitulosProfile.push(t);
    });
    if (dipTitulosProfile.length === 0) {
      if (profile.diplomado_1) dipTitulosProfile.push(profile.diplomado_1);
      if (profile.diplomado_2) dipTitulosProfile.push(profile.diplomado_2);
    }

    // Inyectar el taller que viene incluido en cada diplomado matriculado
    dipTitulosProfile.forEach(dipTitulo => {
      const taller = obtenerTallerParaDiplomado(dipTitulo);
      if (taller && !cursos_json.some((c: any) => c.id === taller.id || c.codigo === taller.codigo)) {
        cursos_json.push({
          id: taller.id,
          codigo: taller.codigo,
          titulo: taller.titulo,
          tipo: 'TALLER',
          categoria: 'Taller',
          esRegalo: true,
          duracion: taller.duracion,
          imagen: taller.imagen,
          color: 'slate',
          nota: 0,
          completado: false,
          avance: 0,
          leccionesTotal: 1,
          leccionesCompletadas: 0,
          activo: true
        });
      }
    });

    cursos_json = await enriquecerCursosConTipoCatalogo(admin, cursos_json);
    await enriquecerConNotasModulos(admin, profile.dni_ce, diplomados_json, cursos_json);

    // Cálculo centralizado de Créditos EDUMIN desde `profiles.cupos_creditos`
    const cupos = parseCuposCreditosFromProfile(profile);
    const tieneDatosEstudiante = Boolean(
      profile.paquete_adquirido || 
      (profile.diplomados && profile.diplomados !== '[]' && profile.diplomados !== '') ||
      cupos.diplomados.adicionales > 0 ||
      cupos.cursos.adicionales > 0
    );

    const paymentState = derivePaymentStateForCredits({
      pagos: rawPagos,
      profile,
      esAdminSinDatos: esAdmin && !tieneDatosEstudiante,
    });

    const eduminCredits = calculateEduminCredits({
      paqueteAdquirido: profile.paquete_adquirido || (esAdmin && !tieneDatosEstudiante ? 'ILIMITADO' : 'COMPLETO'),
      cuotasPagadas: paymentState.cuotasPagadas,
      cuotasTotales: paymentState.cuotasTotales,
      tipoPago: paymentState.tipoPago,
      diplomadosConsumidos: cupos.diplomados.canjeados,
      cursosConsumidos: filtrarCursosReales(cursos_json).length,
      creditosExtraDiplomados: cupos.diplomados.adicionales,
      creditosExtraCursos: cupos.cursos.adicionales
    });

    const fotoPerfilAutenticado = await resolverFotoPerfil(admin, profile);

    return NextResponse.json({
      user,
      profile: {
        ...profile,
        foto_perfil: fotoPerfilAutenticado,
        avatar_url: fotoPerfilAutenticado,
        role: getPrimaryRoleFromProfile(profile),
        cuotas_pagadas: paymentState.cuotasPagadas,
        cuotas_totales: paymentState.cuotasTotales,
        tipo_pago: paymentState.tipoPago,
        diplomados_json,
        cursos_json
      },
      pagos: parsedPagos,
      rawPagos,
      matriculas: matriculasData || [],
      solicitudes: [],
      releasedCredits: eduminCredits.diplomados.liberados,
      availableCredits: eduminCredits.diplomados.disponibles,
      eduminCredits
    }, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=30'
      }
    });
  } catch (err: any) {
    console.error('Error en /api/dashboard/me:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
