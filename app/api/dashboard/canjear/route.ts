import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateReleasedCredits } from '@/lib/utils/credits';
import { obtenerTallerParaDiplomado } from '@/lib/utils/tallerAsignado';
import { parseCursosFromProfile, parseCreditosExtraFromProfile, CursoJSON } from '@/lib/utils/profileParser';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    const body = await request.json();
    const { seleccionados, programaTitulos } = body;

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

    // 2. Verificar Créditos Disponibles
    const creditosExtra = parseCreditosExtraFromProfile(profile);
    const releasedCredits = calculateReleasedCredits(
      profile.paquete_adquirido || 'FULL',
      profile.cuotas_pagadas || 1,
      creditosExtra.creditosExtraDiplomados
    );
    const cuposActuales = profile.cupos_diplomados || 0;
    const disponibles = Math.max(0, releasedCredits - cuposActuales);

    if (seleccionados.length > disponibles) {
      return NextResponse.json({ 
        error: `No posee suficientes cupos disponibles. Intenta canjear ${seleccionados.length} pero solo dispone de ${disponibles}.` 
      }, { status: 400 });
    }

    // 3. Crear registros de matrículas en Supabase (Diplomados y Talleres de regalo)
    const nuevasMatriculas: any[] = [];
    const cursosPerfilActuales: CursoJSON[] = parseCursosFromProfile(profile);
    const cursosNuevos = [...cursosPerfilActuales];

    seleccionados.forEach((itemId: string) => {
      const tituloProg = (programaTitulos && programaTitulos[itemId]) 
        ? programaTitulos[itemId] 
        : `DIPLOMADO EN ${itemId.toUpperCase().replace(/-/g, ' ')}`;

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

      // Taller de regalo asignado según la temática del diplomado
      const tallerRegalo = obtenerTallerParaDiplomado(tituloProg);
      const yaTieneTaller = cursosNuevos.some(c => c.id === tallerRegalo.id || c.codigo === tallerRegalo.codigo);
      
      if (!yaTieneTaller) {
        nuevasMatriculas.push({
          profile_id: profile.id,
          dni_ce: profile.dni_ce,
          item_id: tallerRegalo.id,
          tipo: 'TALLER',
          titulo: tallerRegalo.titulo,
          avance_porcentaje: 0,
          estado: 'EN_CURSO'
        });

        cursosNuevos.push({
          id: tallerRegalo.id,
          codigo: tallerRegalo.codigo,
          titulo: tallerRegalo.titulo,
          nota: 0,
          completado: false,
          avance: 0,
          categoria: tallerRegalo.categoria,
          duracion: tallerRegalo.duracion,
          horas: tallerRegalo.horas
        });
      }
    });

    const { data: insertedMatriculas, error: insertError } = await admin
      .from('matriculas')
      .insert(nuevasMatriculas)
      .select();

    if (insertError) {
      console.warn('Advertencia al insertar en tabla matriculas:', insertError.message);
    }

    // 4. Actualizar cupos_diplomados y cursos (talleres de regalo) en profiles
    const nuevosCuposTotal = cuposActuales + seleccionados.length;
    const cursosSerialized = `CURSOS_LIST|${JSON.stringify(cursosNuevos)}`;

    await admin
      .from('profiles')
      .update({ 
        cupos_diplomados: nuevosCuposTotal,
        diplomado_2: profile.diplomado_2 || (seleccionados[0] ? seleccionados[0].toUpperCase() : null),
        cursos: cursosSerialized,
        cupos_cursos: (profile.cupos_cursos || 0) + (cursosNuevos.length - cursosPerfilActuales.length)
      })
      .eq('id', profile.id);

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
          total_cupos_usados: nuevosCuposTotal
        }
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({
      success: true,
      message: `¡${seleccionados.length} diplomado(s) canjeado(s) exitosamente!`,
      cuposConsumidos: seleccionados.length,
      cuposDisponiblesRestantes: Math.max(0, releasedCredits - nuevosCuposTotal),
      matriculas: insertedMatriculas || nuevasMatriculas
    });
  } catch (err: any) {
    console.error('Error en /api/dashboard/canjear:', err);
    return NextResponse.json({ error: err.message || 'Error al procesar el canje' }, { status: 500 });
  }
}
