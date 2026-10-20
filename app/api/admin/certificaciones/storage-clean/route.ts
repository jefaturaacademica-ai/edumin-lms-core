import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const admin = createAdminClient();

    // 1. Obtener lista de todos los archivos en el bucket 'certificados', carpeta 'fondos'
    const { data: files, error: listError } = await admin.storage
      .from('certificados')
      .list('fondos', { limit: 500 });

    if (listError) {
      return NextResponse.json({ error: `Error listando Storage: ${listError.message}` }, { status: 500 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay imágenes almacenadas en el bucket.',
        eliminados: 0,
        liberadosKb: 0
      });
    }

    // 2. Recopilar URLs que SÍ están activas y protegidas:
    // a) Certificados oficiales emitidos a estudiantes (NUNCA tocar)
    const urlsProtegidas = new Set<string>();

    try {
      const { data: certs } = await admin.from('certificaciones').select('plantilla_snapshot');
      if (certs) {
        certs.forEach(c => {
          const bg = c.plantilla_snapshot?.imagenFondoUrl;
          if (bg && typeof bg === 'string') {
            urlsProtegidas.add(bg);
            const fileNameOnly = bg.split('/').pop()?.split('?')[0];
            if (fileNameOnly) urlsProtegidas.add(fileNameOnly);
          }
        });
      }
    } catch (e) {
      console.warn('Error leyendo certificaciones para depuración:', e);
    }

    // b) Modelos activos en audit_logs o tabla modelos_certificados
    try {
      const { data: logData } = await admin
        .from('audit_logs')
        .select('detalles')
        .eq('accion', 'CONFIG_MODELOS_CERTIFICADOS')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (logData?.detalles?.modelos && Array.isArray(logData.detalles.modelos)) {
        logData.detalles.modelos.forEach((m: any) => {
          if (m.imagenFondoUrl) {
            urlsProtegidas.add(m.imagenFondoUrl);
            const fileNameOnly = m.imagenFondoUrl.split('/').pop()?.split('?')[0];
            if (fileNameOnly) urlsProtegidas.add(fileNameOnly);
          }
        });
      }
    } catch (e) {
      console.warn('Error leyendo modelos para depuración:', e);
    }

    // 3. Identificar archivos huérfanos que nunca fueron emitidos ni están en modelos activos
    const archivosAEliminar: string[] = [];
    let bytesLiberados = 0;

    for (const file of files) {
      // Ignorar placeholders o carpetas
      if (!file.name || file.name === '.emptyFolderPlaceholder') continue;

      const pathRelativo = `fondos/${file.name}`;
      const estaEnUso = urlsProtegidas.has(file.name) || 
        Array.from(urlsProtegidas).some(url => url.includes(file.name));

      if (!estaEnUso) {
        archivosAEliminar.push(pathRelativo);
        bytesLiberados += (file.metadata?.size || 0);
      }
    }

    // 4. Si hay archivos huérfanos, eliminarlos de Supabase Storage de forma segura
    if (archivosAEliminar.length > 0) {
      const { error: removeError } = await admin.storage
        .from('certificados')
        .remove(archivosAEliminar);

      if (removeError) {
        return NextResponse.json({ error: `Error eliminando archivos: ${removeError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      eliminados: archivosAEliminar.length,
      liberadosKb: Math.round(bytesLiberados / 1024),
      protegidosCount: files.length - archivosAEliminar.length,
      archivosEliminados: archivosAEliminar
    });
  } catch (err: any) {
    console.error('Error en limpieza de storage:', err);
    return NextResponse.json({ error: err.message || 'Error en servidor' }, { status: 500 });
  }
}
