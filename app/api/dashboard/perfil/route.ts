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
    const { action, foto_perfil, celular, residencia, nombresSolicitados, apellidosSolicitados, dniSolicitado, motivo, declaracionJurada } = body;

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

    // ACCIÓN A: Actualizar Foto de Perfil o Datos Secundarios (celular, residencia)
    if (action === 'actualizar_foto' || foto_perfil || celular || residencia) {
      const updates: any = {};

      // Manejo de eliminación explícita de foto de perfil
      if (action === 'actualizar_foto' && (!foto_perfil || foto_perfil === '')) {
        try {
          const { data: files } = await admin.storage.from('avatars').list(profile.id);
          if (files && files.length > 0) {
            const filePaths = files.map((f) => `${profile.id}/${f.name}`);
            await admin.storage.from('avatars').remove(filePaths);
          }
        } catch (delErr) {
          console.warn('Advertencia limpiando foto en Supabase Storage:', delErr);
        }
        updates.foto_perfil = null;
      } else if (foto_perfil) {
        let finalFotoUrl = foto_perfil;

        // Si viene como Data URL Base64 (data:image/...), subir al Storage de Supabase
        if (typeof foto_perfil === 'string' && foto_perfil.startsWith('data:image/')) {
          try {
            const matches = foto_perfil.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
              const contentType = matches[1];
              const base64Data = matches[2];
              const buffer = Buffer.from(base64Data, 'base64');
              // Usar ruta fija por usuario para no acumular archivos duplicados
              const fileName = `${profile.id}/avatar.jpg`;

              // 1. Asegurar existencia de bucket público 'avatars'
              const { data: buckets } = await admin.storage.listBuckets();
              const bucketExiste = buckets?.some((b) => b.name === 'avatars');
              if (!bucketExiste) {
                await admin.storage.createBucket('avatars', {
                  public: true,
                  fileSizeLimit: 5242880, // 5MB
                  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
                });
              }

              // 2. Subir imagen al Storage de Supabase sobrescribiendo la anterior
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
                // Parámetro de versión para forzar refresco en navegadores al cambiar de foto
                finalFotoUrl = `${publicUrl}?v=${Date.now()}`;
              } else {
                console.warn('Advertencia al subir a Supabase Storage (usando fallback):', uploadErr.message);
              }
            }
          } catch (storageErr) {
            console.error('Error procesando imagen para Supabase Storage:', storageErr);
          }
        }

        updates.foto_perfil = finalFotoUrl;
      }

      if (celular) updates.telefono = celular;
      if (residencia) updates.residencia = residencia;

      const { data: updatedProfile, error: updateErr } = await admin
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: `Error al actualizar perfil: ${updateErr.message}` }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Foto y datos de perfil actualizados en Supabase.',
        profile: updatedProfile
      });
    }

    // ACCIÓN B: Crear Solicitud de Modificación de Datos de Perfil (DNI / Nombres)
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

      return NextResponse.json({
        success: true,
        message: 'Solicitud de modificación enviada correctamente a Administración.',
        solicitud: insertedSolicitud ? insertedSolicitud[0] : nuevaSolicitud
      });
    }

    return NextResponse.json({ error: 'Acción no especificada' }, { status: 400 });
  } catch (err: any) {
    console.error('Error en /api/dashboard/perfil:', err);
    return NextResponse.json({ error: err.message || 'Error al procesar solicitud de perfil' }, { status: 500 });
  }
}
