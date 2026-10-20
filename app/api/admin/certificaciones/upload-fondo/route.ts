import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const admin = createAdminClient();

    // 1. Asegurar existencia de bucket público 'certificados'
    const { data: buckets } = await admin.storage.listBuckets();
    const bucketExiste = buckets?.some((b) => b.name === 'certificados');
    if (!bucketExiste) {
      await admin.storage.createBucket('certificados', {
        public: true,
        fileSizeLimit: 8388608, // 8MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      });
    }

    const contentType = request.headers.get('content-type') || '';
    let buffer: Buffer;
    let fileExt = 'webp';
    let mimeType = 'image/webp';
    let modeloId = 'plantilla';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const idFromForm = formData.get('modeloId') as string | null;
      if (idFromForm) modeloId = idFromForm.replace(/[^a-zA-Z0-9_-]/g, '');

      if (!file) {
        return NextResponse.json({ error: 'No se envió ningún archivo de imagen.' }, { status: 400 });
      }

      // Validar tamaño máximo (8MB)
      if (file.size > 8 * 1024 * 1024) {
        return NextResponse.json({ error: 'La imagen excede el límite máximo de 8MB.' }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);

      if (file.type.includes('png')) {
        fileExt = 'png';
        mimeType = 'image/png';
      } else if (file.type.includes('jpeg') || file.type.includes('jpg')) {
        fileExt = 'jpg';
        mimeType = 'image/jpeg';
      } else if (file.type.includes('webp')) {
        fileExt = 'webp';
        mimeType = 'image/webp';
      } else {
        return NextResponse.json({ error: 'Formato no permitido. Solo se aceptan PNG, JPG o WEBP.' }, { status: 400 });
      }
    } else {
      // JSON payload con base64
      const body = await request.json();
      const { dataUrl, modeloId: idFromBody } = body;
      if (idFromBody) modeloId = String(idFromBody).replace(/[^a-zA-Z0-9_-]/g, '');

      if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
        return NextResponse.json({ error: 'Imagen en formato dataUrl inválida.' }, { status: 400 });
      }

      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return NextResponse.json({ error: 'Estructura base64 corrupta.' }, { status: 400 });
      }

      mimeType = matches[1];
      const base64Content = matches[2];
      buffer = Buffer.from(base64Content, 'base64');

      if (buffer.length > 8 * 1024 * 1024) {
        return NextResponse.json({ error: 'La imagen excede el límite máximo de 8MB.' }, { status: 400 });
      }

      if (mimeType.includes('png')) fileExt = 'png';
      else if (mimeType.includes('webp')) fileExt = 'webp';
      else fileExt = 'jpg';
    }

    // 2. Nombre de archivo inmutable con marca de tiempo y hash aleatorio
    // ¡IMPORTANTE!: Las imágenes nunca se reemplazan ni sobrescriben.
    // Esto asegura que certificados ya emitidos en el pasado conserven para siempre el fondo exacto
    // con el que fueron otorgados, incluso si el administrador cambia la plantilla del modelo después.
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fileName = `fondos/${modeloId}_${uniqueSuffix}.${fileExt}`;

    const { error: uploadError } = await admin.storage
      .from('certificados')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: false // No sobrescribir, garantizar inmutabilidad histórica
      });

    if (uploadError) {
      console.error('Error al subir imagen a Supabase Storage:', uploadError);
      return NextResponse.json({ error: `Error en almacenamiento: ${uploadError.message}` }, { status: 500 });
    }

    // 3. Obtener la URL pública permanente
    const { data: publicData } = admin.storage
      .from('certificados')
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicData.publicUrl,
      fileName,
      sizeBytes: buffer.length
    });
  } catch (err: any) {
    console.error('Error procesando subida de fondo:', err);
    return NextResponse.json({ error: err.message || 'Error en el servidor al subir fondo' }, { status: 500 });
  }
}
