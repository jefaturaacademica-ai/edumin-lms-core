import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  LeccionRow, 
  normalizeLeccionRow, 
  generarFilasMaestrasIniciales 
} from '@/lib/data/diplomadosLeccionesService';
import { getDiplomadoBySlug, getDiplomadoByTitleOrSlug } from '@/lib/data/diplomadosData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigoParam = searchParams.get('codigo')?.trim();
    const slugParam = searchParams.get('slug')?.trim();

    // Resolver Código de Diplomado (DIP-01 .. DIP-22) a partir de slugParam si no se envió codigoParam
    let targetCodigo = codigoParam;
    if (!targetCodigo && slugParam) {
      if (/^dip-\d+$/i.test(slugParam)) {
        const num = slugParam.replace(/[^0-9]/g, '').padStart(2, '0');
        targetCodigo = `DIP-${num}`;
      } else {
        const matched = getDiplomadoBySlug(slugParam) || getDiplomadoByTitleOrSlug(slugParam);
        if (matched && matched.numId) {
          targetCodigo = `DIP-${matched.numId.toString().padStart(2, '0')}`;
        }
      }
    }

    let admin: any = null;
    try {
      admin = createAdminClient();
    } catch (e) {
      console.warn('No se pudo inicializar createAdminClient, usando fallback local:', e);
    }

    if (admin) {
      let query = admin
        .from('diplomados_lecciones')
        .select('*')
        .order('orden', { ascending: true });

      if (targetCodigo) {
        query = query.ilike('CodigoDiplomado', targetCodigo);
      }

      const { data, error } = await query;

      if (!error && Array.isArray(data) && data.length > 0) {
        let normalized = data.map(normalizeLeccionRow);

        // Si se buscó sin targetCodigo o como salvaguarda adicional de filtrado por slug
        if (slugParam && !targetCodigo) {
          const sLower = slugParam.toLowerCase().replace(/[^a-z0-9]/g, '');
          normalized = normalized.filter(r => {
            const dipSlug = r.Diplomado.toLowerCase().replace(/[^a-z0-9]/g, '');
            const codSlug = r.CodigoDiplomado.toLowerCase().replace(/[^a-z0-9]/g, '');
            return dipSlug.includes(sLower) || sLower.includes(dipSlug) || codSlug.includes(sLower) || sLower.includes(codSlug);
          });
        }

        return NextResponse.json({
          success: true,
          tablaCreada: true,
          total: normalized.length,
          filas: normalized
        });
      }
    }

    // Fallback garantizado: datos maestros si la tabla aún no se ha creado o está vacía
    const maestros = generarFilasMaestrasIniciales();
    let filtradas = maestros;

    if (targetCodigo) {
      filtradas = maestros.filter(m => m.CodigoDiplomado.toLowerCase() === targetCodigo.toLowerCase());
    } else if (slugParam) {
      const sLower = slugParam.toLowerCase().replace(/[^a-z0-9]/g, '');
      filtradas = maestros.filter(m => {
        const dipSlug = m.Diplomado.toLowerCase().replace(/[^a-z0-9]/g, '');
        const codSlug = m.CodigoDiplomado.toLowerCase().replace(/[^a-z0-9]/g, '');
        return dipSlug.includes(sLower) || sLower.includes(dipSlug) || codSlug.includes(sLower) || sLower.includes(codSlug);
      });
    }

    return NextResponse.json({
      success: true,
      tablaCreada: false,
      total: filtradas.length,
      filas: filtradas,
      aviso: 'Mostrando datos base. Si creaste la tabla diplomados_lecciones en Supabase, pulsa "Sincronizar Tabla" para guardar los registros permanentemente.'
    });
  } catch (err: any) {
    console.error('Error en GET /api/admin/diplomados-lecciones:', err);
    return NextResponse.json({
      success: false,
      error: err.message,
      filas: generarFilasMaestrasIniciales()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    // 1. Acción especial: Sembrar masivamente todas las filas maestras en Supabase
    if (body.action === 'seed') {
      const filasMaestras = generarFilasMaestrasIniciales();

      // Limpiar filas anteriores si se solicita reemplazo total
      if (body.replace) {
        await admin.from('diplomados_lecciones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      // Insertar por lotes de 100 para no sobrecargar el payload
      const batchSize = 100;
      let insertados = 0;

      for (let i = 0; i < filasMaestras.length; i += batchSize) {
        const batch = filasMaestras.slice(i, i + batchSize);
        const { error } = await admin.from('diplomados_lecciones').insert(batch);
        if (error) {
          throw new Error(`Error al sembrar lote ${i}: ${error.message}`);
        }
        insertados += batch.length;
      }

      return NextResponse.json({
        success: true,
        message: `¡Se sembraron exitosamente ${insertados} lecciones en public.diplomados_lecciones de Supabase!`,
        total: insertados
      });
    }

    // 2. Inserción o actualización de filas recibidas (ej. desde Excel o CSV)
    const rawFilas = Array.isArray(body.rows) ? body.rows : (body.row ? [body.row] : []);
    if (rawFilas.length === 0) {
      return NextResponse.json({ error: 'No se enviaron filas para guardar' }, { status: 400 });
    }

    const filasNormalizadas = rawFilas.map((r: any, idx: number) => {
      const norm = normalizeLeccionRow(r);
      return {
        ...norm,
        orden: norm.orden || idx + 1
      };
    });

    // Identificar todos los códigos únicos de diplomados presentes en el lote para SOBREESCRIBIR sin duplicar
    const codigosEnLote = Array.from(new Set(
      filasNormalizadas.map((f: any) => f.CodigoDiplomado?.trim().toUpperCase()).filter(Boolean)
    ));

    const codigosAEliminar = body.codigoDiplomado 
      ? [body.codigoDiplomado.trim().toUpperCase()] 
      : codigosEnLote;

    // Eliminar las filas previas de esos diplomados específicos para SOBREESCRIBIR garantizando 0 duplicados
    for (const cod of codigosAEliminar) {
      await admin.from('diplomados_lecciones').delete().ilike('CodigoDiplomado', cod);
    }

    // Insertar por lotes
    const batchSize = 80;
    let guardados = 0;

    for (let i = 0; i < filasNormalizadas.length; i += batchSize) {
      const batch = filasNormalizadas.slice(i, i + batchSize);
      const { error } = await admin.from('diplomados_lecciones').insert(batch);
      if (error) {
        throw new Error(`Error al insertar en Supabase: ${error.message}`);
      }
      guardados += batch.length;
    }

    return NextResponse.json({
      success: true,
      message: `¡${guardados} lecciones y enlaces guardados exitosamente en Supabase!`,
      total: guardados
    });
  } catch (err: any) {
    console.error('Error en POST /api/admin/diplomados-lecciones:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const admin = createAdminClient();
    const { id, row } = body;

    if (!id && !row?.id) {
      return NextResponse.json({ error: 'Se requiere ID para actualizar la lección' }, { status: 400 });
    }

    const targetId = id || row.id;
    const norm = normalizeLeccionRow(row);

    const { data, error } = await admin
      .from('diplomados_lecciones')
      .update(norm)
      .eq('id', targetId)
      .select()
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, leccion: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigoParam = searchParams.get('codigo')?.trim();
    const idParam = searchParams.get('id')?.trim();

    const admin = createAdminClient();

    if (idParam) {
      const { error } = await admin.from('diplomados_lecciones').delete().eq('id', idParam);
      if (error) throw error;
      return NextResponse.json({ success: true, message: `Lección ${idParam} eliminada.` });
    }

    if (codigoParam) {
      const { error } = await admin.from('diplomados_lecciones').delete().eq('CodigoDiplomado', codigoParam);
      if (error) throw error;
      return NextResponse.json({ success: true, message: `Todas las lecciones de ${codigoParam} eliminadas.` });
    }

    return NextResponse.json({ error: 'Proporciona un id o codigo para eliminar' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
