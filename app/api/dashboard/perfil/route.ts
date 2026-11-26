import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action, 
      foto_perfil, 
      celular, 
      residencia, 
      fecha_nacimiento,
      nombresSolicitados, 
      apellidosSolicitados, 
      dniSolicitado, 
      motivo, 
      declaracionJurada 
    } = body;

    const admin = createAdminClient();

    // 1. Obtener Perfil Actual
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil de estudiante no encontrado.' }, { status: 404 });
    }

    // 2. Procesar actualización de foto de perfil
    let finalFotoUrl = profile.foto_perfil || null;
    let fotoActualizada = false;

    if (action === 'actualizar_foto') {
      fotoActualizada = true;
      if (!foto_perfil || foto_perfil === '') {
        try {
          const { data: files } = await admin.storage.from('avatars').list(profile.id);
          if (files && files.length > 0) {
            const filePaths = files.map((f: any) => `${profile.id}/${f.name}`);
            await admin.storage.from('avatars').remove(filePaths);
          }
        } catch (delErr) {
          console.warn('Advertencia limpiando foto en Supabase Storage:', delErr);
        }
        finalFotoUrl = null;
      } else if (typeof foto_perfil === 'string' && foto_perfil.startsWith('data:image/')) {
        try {
          const matches = foto_perfil.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const contentType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            const fileName = `${profile.id}/avatar.jpg`;

            const { data: buckets } = await admin.storage.listBuckets();
            const bucketExiste = buckets?.some((b: any) => b.name === 'avatars');
            if (!bucketExiste) {
              await admin.storage.createBucket('avatars', {
                public: true,
                fileSizeLimit: 5242880,
                allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
              });
            }

            const { error: uploadErr } = await admin.storage
              .from('avatars')
              .upload(fileName, buffer, {
                contentType: 'image/jpeg',
                upsert: true
              });

            if (!uploadErr) {
              const { data: { publicUrl } } = admin.storage
                .from('avatars')
                .getPublicUrl(fileName);
              finalFotoUrl = `${publicUrl}?v=${Date.now()}`;
            } else {
              console.warn('Advertencia subiendo foto a storage:', uploadErr.message);
            }
          }
        } catch (storageErr) {
          console.error('Error procesando imagen para Supabase Storage:', storageErr);
        }
      }
    }

    // 3. Actualizar datos de contacto directos (celular/teléfono y residencia) en profiles
    const profileUpdates: any = {};
    if (fotoActualizada) {
      profileUpdates.foto_perfil = finalFotoUrl;
    }
    if (celular !== undefined && celular !== null) {
      profileUpdates.telefono = celular;
    }
    if (residencia !== undefined && residencia !== null) {
      profileUpdates.residencia = residencia;
    }
    if (fecha_nacimiento !== undefined && fecha_nacimiento !== null) {
      profileUpdates.fecha_nacimiento = fecha_nacimiento ? String(fecha_nacimiento).trim() : null;
    }

    let updatedProfile = profile;
    if (Object.keys(profileUpdates).length > 0) {
      const { data: up, error: updateErr } = await admin
        .from('profiles')
        .update(profileUpdates)
        .eq('id', profile.id)
        .select()
        .single();

      if (!updateErr && up) {
        updatedProfile = up;
      } else if (updateErr) {
        console.error('Error actualizando profiles:', updateErr);
      }
    }

    if (action === 'actualizar_contacto') {
      return NextResponse.json({
        success: true,
        message: 'Datos de contacto actualizados correctamente.',
        profile: updatedProfile
      });
    }

    // 4. Si es solicitud de cambio de datos personales (nombres / DNI)
    let solicitudCreada = null;
    if (action === 'solicitud_cambio_datos' || nombresSolicitados || dniSolicitado) {
      const nuevaSolicitud = {
        profile_id: profile.id,
        dni_actual: profile.dni_ce,
        nombres_actuales: profile.nombres,
        apellidos_actuales: profile.apellidos,
        dni_solicitado: dniSolicitado || profile.dni_ce,
        nombres_solicitados: nombresSolicitados || profile.nombres,
        apellidos_solicitados: apellidosSolicitados || profile.apellidos,
        motivo: motivo || 'Rectificación de Datos de Certificación',
        declaracion_jurada: Boolean(declaracionJurada),
        estado: 'Pendiente'
      };

      const { data: insertedSolicitud, error: solError } = await admin
        .from('solicitudes_cambio_datos')
        .insert(nuevaSolicitud)
        .select();

      if (solError) {
        console.warn('Advertencia al insertar en solicitudes_cambio_datos:', solError.message);
      } else if (insertedSolicitud) {
        solicitudCreada = insertedSolicitud[0];
      }

      // Audit Log
      try {
        await admin.from('audit_logs').insert({
          usuario_email: profile.email || user.email || 'alumno@edumin.pe',
          accion: 'SOLICITUD_CAMBIO_DATOS_ENVIADA',
          detalles: nuevaSolicitud
        });
      } catch (e) {
        console.error(e);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Datos procesados correctamente.',
      profile: updatedProfile,
      solicitud: solicitudCreada
    });
  } catch (err: any) {
    console.error('Error en /api/dashboard/perfil:', err);
    return NextResponse.json({ error: err.message || 'Error al procesar solicitud de perfil' }, { status: 500 });
  }
}
