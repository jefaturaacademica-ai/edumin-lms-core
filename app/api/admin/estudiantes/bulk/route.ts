import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { obtenerSiguienteCorrelativo } from '@/lib/utils/reciboCorrelativo';
import { calcularFechasVencimientoPorDefecto } from '@/lib/utils/fechasCuotas';
import { getDiplomadoByTitleOrSlug } from '@/lib/data/diplomadosData';
import { obtenerTallerParaDiplomado } from '@/lib/utils/tallerAsignado';
import { invalidateEstudiantesCache } from '@/app/api/admin/estudiantes/route';

interface EstudianteBulkItem {
  dni_ce: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono?: string;
  fecha_nacimiento?: string;
  paquete_adquirido?: string;
  tipo_pago?: string;
  cuotas_totales?: number | string;
  monto_total?: number | string;
  monto_cuota?: number | string;
  diplomado_1?: string;
}

export async function POST(request: Request) {
  try {
    invalidateEstudiantesCache();
    const body = await request.json();
    const lista: EstudianteBulkItem[] = Array.isArray(body?.estudiantes) ? body.estudiantes : [];

    if (lista.length === 0) {
      return NextResponse.json(
        { error: 'No se enviaron datos de estudiantes para registrar.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Obtener registros existentes para evitar duplicados en BD
    const [
      { data: existingProfiles },
      userListRes,
      { data: todosPagosExistentes },
      { data: todosAuditsExistentes }
    ] = await Promise.all([
      admin.from('profiles').select('id, dni_ce, email'),
      admin.auth.admin.listUsers({ perPage: 1000 }).catch(() => ({ data: { users: [] as any[] } })),
      admin.from('pagos').select('*'),
      admin.from('audit_logs').select('*')
    ]);

    const existingDnis = new Set<string>();
    const existingEmails = new Set<string>();

    (existingProfiles || []).forEach((p: any) => {
      if (p.dni_ce) existingDnis.add(String(p.dni_ce).trim().toLowerCase());
      if (p.email) existingEmails.add(String(p.email).trim().toLowerCase());
    });

    const authUsersByEmail = new Map<string, string>();
    ((userListRes as any)?.data?.users || []).forEach((u: any) => {
      if (u.email) authUsersByEmail.set(String(u.email).trim().toLowerCase(), u.id);
    });

    let acumuladoPagos = [...(todosPagosExistentes || [])];
    let acumuladoAudits = [...(todosAuditsExistentes || [])];

    const resultados = {
      total: lista.length,
      creados: 0,
      omitidos: 0,
      errores: 0,
      detalles: [] as Array<{
        dni_ce: string;
        nombre: string;
        estado: 'creado' | 'omitido' | 'error';
        mensaje: string;
      }>
    };

    // 2. Procesar cada estudiante en secuencia segura
    for (let idx = 0; idx < lista.length; idx++) {
      const item = lista[idx];
      const normalizedDni = String(item.dni_ce || '').trim();
      const normalizedEmail = String(item.email || '').trim().toLowerCase();
      const nombresTrim = String(item.nombres || '').trim();
      const apellidosTrim = String(item.apellidos || '').trim();
      const nombreCompleto = `${nombresTrim} ${apellidosTrim}`.trim() || `Fila ${idx + 1}`;

      // Validación de campos mínimos obligatorios
      if (!normalizedDni || !nombresTrim || !apellidosTrim || !normalizedEmail) {
        resultados.errores++;
        resultados.detalles.push({
          dni_ce: normalizedDni || 'S/DNI',
          nombre: nombreCompleto,
          estado: 'error',
          mensaje: 'Faltan campos obligatorios (DNI, nombres, apellidos o correo).'
        });
        continue;
      }

      // Verificación de duplicados (en BD previa o en el mismo lote)
      const dniKey = normalizedDni.toLowerCase();
      if (existingDnis.has(dniKey) || existingEmails.has(normalizedEmail)) {
        resultados.omitidos++;
        resultados.detalles.push({
          dni_ce: normalizedDni,
          nombre: nombreCompleto,
          estado: 'omitido',
          mensaje: 'Ya existe un estudiante registrado con este DNI o correo en el sistema.'
        });
        continue;
      }

      try {
        // A. Crear o resolver usuario en Supabase Auth
        let studentId = authUsersByEmail.get(normalizedEmail) || '';
        if (!studentId) {
          const { data: authUser, error: authError } = await admin.auth.admin.createUser({
            email: normalizedEmail,
            password: normalizedDni,
            email_confirm: true,
            user_metadata: { dni_ce: normalizedDni }
          });

          if (authError) {
            // Si el correo ya existía en Auth pero no en profiles
            const { data: freshList } = await admin.auth.admin.listUsers();
            const foundUser = freshList?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
            if (foundUser) {
              studentId = foundUser.id;
            } else {
              throw new Error(`Auth Error: ${authError.message}`);
            }
          } else if (authUser?.user?.id) {
            studentId = authUser.user.id;
          }
        }

        if (!studentId) {
          throw new Error('No se pudo generar el identificador de usuario en Auth.');
        }

        authUsersByEmail.set(normalizedEmail, studentId);

        // B. Preparar diplomado inicial y taller de regalo
        const rawDipTitulo = String(item.diplomado_1 || 'DERECHO MINERO').trim();
        const dipData = getDiplomadoByTitleOrSlug(rawDipTitulo);
        const dipTitulo = dipData?.titulo || rawDipTitulo.replace(/^DIPLOMADO EN\s+/i, '').trim().toUpperCase();

        const modulosList = dipData?.modulos && dipData.modulos.length > 0
          ? dipData.modulos.map((m: any, mIdx: number) => {
              const modCod = m.codigo || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`;
              return {
                id: modCod,
                codigo: modCod,
                nombre: m.nombre || modCod,
                nota: 0,
                completado: false
              };
            })
          : [
              { id: 'MÓDULO 01', codigo: 'MÓDULO 01', nombre: `MÓDULO 01 DE ${dipTitulo}`, nota: 0, completado: false },
              { id: 'MÓDULO 02', codigo: 'MÓDULO 02', nombre: `MÓDULO 02 DE ${dipTitulo}`, nota: 0, completado: false },
              { id: 'MÓDULO 03', codigo: 'MÓDULO 03', nombre: `MÓDULO 03 DE ${dipTitulo}`, nota: 0, completado: false }
            ];

        const diplomadosJson = [
          {
            id: dipData?.slug || dipTitulo.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            slug: dipData?.slug || dipTitulo.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            titulo: dipTitulo,
            avance: 0,
            modulos: modulosList
          }
        ];

        const tallerRegalo = obtenerTallerParaDiplomado(dipTitulo);
        const cursosJson = [
          {
            id: tallerRegalo.id,
            codigo: tallerRegalo.codigo,
            titulo: tallerRegalo.titulo,
            avance: 0,
            nota: 0,
            completado: false,
            categoria: tallerRegalo.categoria,
            duracion: tallerRegalo.duracion,
            horas: tallerRegalo.horas,
            tipo: 'TALLER',
            esRegalo: true
          }
        ];

        const paqueteInput = String(item.paquete_adquirido || 'COMPLETO').toUpperCase().trim();
        const esPaqueteEnumEstandar = ['COMPLETO', 'FULL', 'ILIMITADO'].includes(paqueteInput);
        const paqueteEnumDb = esPaqueteEnumEstandar ? paqueteInput : (paqueteInput.includes('ILIMITADO') ? 'ILIMITADO' : 'FULL');

        const esContado = String(item.tipo_pago || '').toUpperCase().trim() === 'CONTADO';
        const numCuotasTotales = esContado ? 1 : Number(item.cuotas_totales || (paqueteInput === 'ILIMITADO' ? 5 : 3));
        const montoTotalNum = Number(item.monto_total || (paqueteInput === 'ILIMITADO' ? 1500 : (paqueteInput === 'FULL' ? 900 : 540)));
        const montoCuotaNum = esContado 
          ? montoTotalNum 
          : Number(item.monto_cuota || (paqueteInput === 'ILIMITADO' ? 300 : 180));

        const cuposDiplomadosFinal = paqueteInput === 'ILIMITADO' ? 3 : 1;
        const cuposCursosFinal = paqueteInput === 'ILIMITADO' ? 15 : (paqueteInput === 'FULL' ? 5 : 3);

        // C. Insertar perfil en Supabase
        const insertPayload: Record<string, any> = {
          id: studentId,
          dni_ce: normalizedDni,
          nombres: nombresTrim,
          apellidos: apellidosTrim,
          email: normalizedEmail,
          telefono: item.telefono ? String(item.telefono).trim() : '',
          roles: { administrativo: null, academico: 'ESTUDIANTE' },
          paquete_adquirido: paqueteEnumDb,
          cuotas_pagadas: 1,
          cupos_creditos: {
            diplomados: { asignados: cuposDiplomadosFinal, adicionales: 0, canjeados: diplomadosJson.length },
            cursos: { asignados: cuposCursosFinal, adicionales: 0, canjeados: 0 },
            compras_directas: []
          },
          diplomados: `DIPLOMADOS_LIST|${JSON.stringify(diplomadosJson)}`,
          cursos: `CURSOS_LIST|${JSON.stringify(cursosJson)}`,
          debe_cambiar_password: true,
          fecha_nacimiento: item.fecha_nacimiento ? String(item.fecha_nacimiento).trim() : null
        };

        const { error: profileErr } = await admin
          .from('profiles')
          .insert(insertPayload);

        if (profileErr) {
          throw new Error(`Profile Error: ${profileErr.message}`);
        }

        // Registrar DNI e email en memoria para el resto del lote
        existingDnis.add(dniKey);
        existingEmails.add(normalizedEmail);

        // D. Generar cronograma y recibo oficial de matrícula
        const cuotasArray = Array(6).fill('no corresponde');
        for (let i = 0; i < numCuotasTotales && i < 6; i++) {
          cuotasArray[i] = i === 0 ? String(montoCuotaNum) : '0';
        }

        const initialTotalPagado = montoCuotaNum;
        const initialDeuda = esContado ? 0 : Math.max(0, montoTotalNum - initialTotalPagado);
        const correlativoRecibo = obtenerSiguienteCorrelativo(acumuladoPagos, acumuladoAudits);
        acumuladoPagos.push({ nro_recibo: correlativoRecibo, comprobante: correlativoRecibo });

        const fechasVencimientoIniciales = calcularFechasVencimientoPorDefecto(new Date(), numCuotasTotales);

        const initialMetodo = `CREDITO_1|${JSON.stringify({
          num_credito: 1,
          cuotas: cuotasArray,
          cuotas_recibos: {
            0: {
              nro_recibo: correlativoRecibo,
              nro_operacion: correlativoRecibo,
              fecha: new Date().toISOString()
            }
          },
          fechas_vencimiento: fechasVencimientoIniciales,
          total_pagado: initialTotalPagado,
          total_deuda: initialDeuda,
          ultimo_pago: {
            monto: montoCuotaNum,
            metodo: 'Matrícula Inicial (Carga Masiva)',
            nro_recibo: correlativoRecibo,
            nro_operacion: correlativoRecibo,
            comprobante: correlativoRecibo,
            fecha: new Date().toISOString()
          }
        })}`;

        try {
          await admin.from('pagos').insert({
            profile_id: studentId,
            dni_ce: normalizedDni,
            monto: montoTotalNum,
            metodo: initialMetodo,
            nro_recibo: correlativoRecibo,
            nro_operacion: correlativoRecibo,
            comprobante: correlativoRecibo,
            estado: initialDeuda === 0 ? 'Completado' : 'Pendiente'
          });
        } catch (pagErr) {
          console.warn('Advertencia pago bulk:', pagErr);
        }

        // E. Registrar matrículas iniciales de diplomado y taller
        try {
          await admin.from('matriculas').insert([
            {
              profile_id: studentId,
              dni_ce: normalizedDni,
              item_id: dipData?.slug || dipTitulo.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
              tipo: 'DIPLOMADO',
              titulo: dipTitulo,
              avance_porcentaje: 0,
              estado: 'EN_CURSO'
            },
            {
              profile_id: studentId,
              dni_ce: normalizedDni,
              item_id: tallerRegalo.id,
              tipo: 'TALLER',
              titulo: tallerRegalo.titulo,
              avance_porcentaje: 0,
              estado: 'EN_CURSO'
            }
          ]);
        } catch (matErr) {
          console.warn('Advertencia matrícula bulk:', matErr);
        }

        resultados.creados++;
        resultados.detalles.push({
          dni_ce: normalizedDni,
          nombre: nombreCompleto,
          estado: 'creado',
          mensaje: 'Registrado con éxito. Contraseña inicial: DNI'
        });

      } catch (rowErr: any) {
        console.error(`Error procesando estudiante ${normalizedDni}:`, rowErr);
        resultados.errores++;
        resultados.detalles.push({
          dni_ce: normalizedDni,
          nombre: nombreCompleto,
          estado: 'error',
          mensaje: rowErr.message || 'Error inesperado durante la creación.'
        });
      }
    }

    // Auditoría general del lote
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: 'CARGA_MASIVA_ESTUDIANTES_EXCEL',
        detalles: {
          total_enviados: resultados.total,
          creados: resultados.creados,
          omitidos: resultados.omitidos,
          errores: resultados.errores
        }
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      mensaje: `Carga masiva finalizada: ${resultados.creados} estudiantes creados, ${resultados.omitidos} omitidos por ya existir, ${resultados.errores} con errores.`,
      ...resultados
    });

  } catch (globalErr: any) {
    console.error('Error general en POST /api/admin/estudiantes/bulk:', globalErr);
    return NextResponse.json(
      { error: `Error en el servidor: ${globalErr.message}` },
      { status: 500 }
    );
  }
}
