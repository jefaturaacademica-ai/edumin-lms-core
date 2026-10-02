import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateReleasedCredits } from '@/lib/utils/credits';

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
    const releasedCredits = calculateReleasedCredits(
      profile.paquete_adquirido || 'FULL',
      profile.cuotas_pagadas || 1
    );
    const cuposActuales = profile.cupos_diplomados || 0;
    const disponibles = Math.max(0, releasedCredits - cuposActuales);

    if (seleccionados.length > disponibles) {
      return NextResponse.json({ 
        error: `No posee suficientes cupos disponibles. Intenta canjear ${seleccionados.length} pero solo dispone de ${disponibles}.` 
      }, { status: 400 });
    }

    // 3. Crear registros de matrículas en Supabase
    const nuevasMatriculas = seleccionados.map((itemId: string, idx: number) => {
      const tituloProg = (programaTitulos && programaTitulos[itemId]) 
        ? programaTitulos[itemId] 
        : `DIPLOMADO EN ${itemId.toUpperCase().replace(/-/g, ' ')}`;

      return {
        profile_id: profile.id,
        dni_ce: profile.dni_ce,
        item_id: itemId,
        tipo: 'DIPLOMADO',
        titulo: tituloProg,
        avance_porcentaje: 0,
        estado: 'EN_CURSO'
      };
    });

    const { data: insertedMatriculas, error: insertError } = await admin
      .from('matriculas')
      .insert(nuevasMatriculas)
      .select();

    if (insertError) {
      console.warn('Advertencia al insertar en tabla matriculas:', insertError.message);
    }

    // 4. Actualizar cupos_diplomados en profiles
    const nuevosCuposTotal = cuposActuales + seleccionados.length;
    await admin
      .from('profiles')
      .update({ 
        cupos_diplomados: nuevosCuposTotal,
        diplomado_2: profile.diplomado_2 || (seleccionados[0] ? seleccionados[0].toUpperCase() : null)
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
