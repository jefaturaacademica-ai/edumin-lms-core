import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateEduminCredits, derivePaymentStateForCredits } from '@/lib/utils/credits';
import { obtenerTallerParaDiplomado } from '@/lib/utils/tallerAsignado';
import { getDiplomadoByTitleOrSlug } from '@/lib/data/diplomadosData';
import {
  parseDiplomadosFromProfile,
  parseCursosFromProfile,
  parseCuposCreditosFromProfile,
  buildUpdatedCuposCreditos,
  filtrarCursosReales,
  CursoJSON,
  DiplomadoJSON,
  ModuloJSON
} from '@/lib/utils/profileParser';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    const body = await request.json();
    const { seleccionados, programaTitulos, tipo = 'DIPLOMADO' } = body;

    if (!Array.isArray(seleccionados) || seleccionados.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar al menos un programa para canjear.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Verificar Perfil del Estudiante
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil de estudiante no encontrado.' }, { status: 404 });
    }

    // 2. Verificar Créditos Disponibles desde `profiles.cupos_creditos` y pagos reales
    const diplomadosActuales: DiplomadoJSON[] = parseDiplomadosFromProfile(profile);
    const cursosPerfilActuales: CursoJSON[] = parseCursosFromProfile(profile);
    const cuposActuales = parseCuposCreditosFromProfile(profile);

    let rawPagos: any[] = [];
    if (profile.dni_ce) {
      const { data: pData } = await admin
        .from('pagos')
        .select('*')
        .or(`profile_id.eq.${profile.id},dni_ce.eq.${profile.dni_ce},metodo.ilike.%${profile.dni_ce}%`)
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

    const paymentState = derivePaymentStateForCredits({
      pagos: rawPagos,
      profile,
    });

    const eduminCredits = calculateEduminCredits({
      paqueteAdquirido: profile.paquete_adquirido || 'COMPLETO',
      cuotasPagadas: paymentState.cuotasPagadas,
      cuotasTotales: paymentState.cuotasTotales,
      tipoPago: paymentState.tipoPago,
      diplomadosConsumidos: diplomadosActuales.length,
      cursosConsumidos: filtrarCursosReales(cursosPerfilActuales).length,
      creditosExtraDiplomados: cuposActuales.diplomados.adicionales,
      creditosExtraCursos: cuposActuales.cursos.adicionales
    });

    const esCurso = tipo === 'CURSO';
    const disponibles = esCurso ? eduminCredits.cursos.disponibles : eduminCredits.diplomados.disponibles;

    if (seleccionados.length > disponibles) {
      return NextResponse.json({ 
        error: `No posee suficientes créditos de ${esCurso ? 'cursos' : 'diplomados'} disponibles. Intenta canjear ${seleccionados.length} pero solo dispone de ${disponibles}.` 
      }, { status: 400 });
    }

    const nuevasMatriculas: any[] = [];

    if (esCurso) {
      // CANJE DE CURSOS LIBRES
      const cursosNuevos = [...cursosPerfilActuales];

      seleccionados.forEach((item: any) => {
        const itemId = typeof item === 'object' ? item.id : String(item);
        const itemTitulo = (programaTitulos && programaTitulos[itemId]) 
          ? programaTitulos[itemId] 
          : (typeof item === 'object' ? item.titulo || item.curso : `CURSO ${itemId}`);
        const categoria = (typeof item === 'object' && item.categoria) ? item.categoria : 'Curso Libre';
        const duracion = (typeof item === 'object' && item.duracion) ? item.duracion : '25 Horas Académicas';
        const horas = (typeof item === 'object' && item.horas) ? item.horas : '25';
        const imagen = (typeof item === 'object' && item.imagen) ? item.imagen : undefined;

        nuevasMatriculas.push({
          profile_id: profile.id,
          dni_ce: profile.dni_ce,
          item_id: String(itemId),
          tipo: 'CURSO',
          titulo: itemTitulo,
          avance_porcentaje: 0,
          estado: 'EN_CURSO'
        });

        if (!cursosNuevos.some(c => String(c.id) === String(itemId) || c.titulo?.toUpperCase() === itemTitulo?.toUpperCase())) {
          cursosNuevos.push({
            id: String(itemId),
            codigo: (typeof item === 'object' && item.codigo) ? item.codigo : `CUR-${itemId}`,
            titulo: itemTitulo,
            tipo: 'CURSO',
            nota: 0,
            completado: false,
            avance: 0,
            categoria,
            duracion,
            horas,
            imagen
          });
        }
      });

      const nuevosCuposCreditos = buildUpdatedCuposCreditos(profile, {
        cursosCanjeados: filtrarCursosReales(cursosNuevos).length
      });

      const { error: updateError } = await admin
        .from('profiles')
        .update({
          cursos: `CURSOS_LIST|${JSON.stringify(cursosNuevos)}`,
          cupos_creditos: nuevosCuposCreditos
        })
        .eq('id', profile.id);

      if (updateError) {
        console.error('Error al actualizar profile.cursos:', updateError);
        return NextResponse.json({ error: `Error al registrar curso: ${updateError.message}` }, { status: 500 });
      }

      try {
        await admin.from('audit_logs').insert({
          usuario_email: profile.email || user.email || 'alumno@edumin.pe',
          accion: 'CANJE_CURSOS_CREDITO',
          detalles: {
            profile_id: profile.id,
            dni_ce: profile.dni_ce,
            estudiante: `${profile.nombres} ${profile.apellidos}`,
            seleccionados,
            cupos_consumidos: seleccionados.length,
            total_cursos_enrolados: cursosNuevos.length
          }
        });
      } catch (e) {
        console.error(e);
      }

      return NextResponse.json({
        success: true,
        message: `¡${seleccionados.length} curso(s) libre(s) canjeado(s) exitosamente!`,
        cuposConsumidos: seleccionados.length,
        cuposDisponiblesRestantes: Math.max(0, disponibles - seleccionados.length),
        matriculas: nuevasMatriculas
      });
    }

    // CANJE DE DIPLOMADOS
    const diplomadosNuevos = [...diplomadosActuales];
    const cursosNuevos = [...cursosPerfilActuales];

    seleccionados.forEach((itemId: string) => {
      const tituloProg = (programaTitulos && programaTitulos[itemId]) 
        ? programaTitulos[itemId] 
        : `DIPLOMADO EN ${itemId.toUpperCase().replace(/-/g, ' ')}`;

      // Agregar a diplomados_json si no existe
      if (!diplomadosNuevos.some(d => d.slug === itemId || d.id === itemId)) {
        const dipInfo = getDiplomadoByTitleOrSlug(itemId) || getDiplomadoByTitleOrSlug(tituloProg);
        const modulosList: ModuloJSON[] = (dipInfo?.modulos && dipInfo.modulos.length > 0)
          ? dipInfo.modulos.map((m: any, mIdx: number) => {
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
              { id: 'MÓDULO 01', codigo: 'MÓDULO 01', nombre: 'MÓDULO 01', nota: 0, completado: false },
              { id: 'MÓDULO 02', codigo: 'MÓDULO 02', nombre: 'MÓDULO 02', nota: 0, completado: false },
              { id: 'MÓDULO 03', codigo: 'MÓDULO 03', nombre: 'MÓDULO 03', nota: 0, completado: false }
            ];

        diplomadosNuevos.push({
          id: itemId,
          slug: itemId,
          titulo: tituloProg,
          avance: 0,
          completado: false,
          modulos: modulosList
        });
      }

      // Matrícula del Diplomado
      nuevasMatriculas.push({
        profile_id: profile.id,
        dni_ce: profile.dni_ce,
        item_id: itemId,
        tipo: 'DIPLOMADO',
        titulo: tituloProg,
        avance_porcentaje: 0,
        estado: 'EN_CURSO'
      });

      // Inyectar el taller de regalo incluido con este diplomado
      const taller = obtenerTallerParaDiplomado(tituloProg);
      if (taller && !cursosNuevos.some(c => c.id === taller.id || c.codigo === taller.codigo)) {
        cursosNuevos.push({
          id: taller.id,
          codigo: taller.codigo,
          titulo: taller.titulo,
          nota: 0,
          completado: false,
          avance: 0,
          categoria: 'Talleres',
          duracion: taller.duracion,
          horas: '20',
          tipo: 'TALLER',
          esRegalo: true,
          imagen: taller.imagen
        });
      }
    });

    // 4. Actualizar cupos_creditos, diplomados y cursos (talleres de regalo) en profiles
    const nuevosCuposCreditos = buildUpdatedCuposCreditos(profile, {
      diplomadosCanjeados: diplomadosNuevos.length
    });
    const diplomadosSerialized = `DIPLOMADOS_LIST|${JSON.stringify(diplomadosNuevos)}`;

    const { error: updateError } = await admin
      .from('profiles')
      .update({
        diplomados: diplomadosSerialized,
        cupos_creditos: nuevosCuposCreditos,
        cursos: `CURSOS_LIST|${JSON.stringify(cursosNuevos)}`
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error('Error al actualizar diplomados en profile:', updateError);
      return NextResponse.json({ error: `Error al registrar diplomado: ${updateError.message}` }, { status: 500 });
    }

    // 5. Registrar auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: profile.email || user.email || 'alumno@edumin.pe',
        accion: 'CANJE_DIPLOMADOS_CREDITO',
        detalles: {
          profile_id: profile.id,
          dni_ce: profile.dni_ce,
          estudiante: `${profile.nombres} ${profile.apellidos}`,
          seleccionados,
          cupos_consumidos: seleccionados.length,
          total_cupos_usados: nuevosCuposCreditos.diplomados.canjeados
        }
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({
      success: true,
      message: `¡${seleccionados.length} diplomado(s) canjeado(s) exitosamente!`,
      cuposConsumidos: seleccionados.length,
      cuposDisponiblesRestantes: Math.max(0, disponibles - seleccionados.length),
      matriculas: nuevasMatriculas
    });
  } catch (err: any) {
    console.error('Error en /api/dashboard/canjear:', err);
    return NextResponse.json({ error: err.message || 'Error al procesar el canje' }, { status: 500 });
  }
}
