import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  LeccionRow, 
  normalizeLeccionRow, 
  generarFilasMaestrasIniciales 
} from '@/lib/data/diplomadosLeccionesService';
import { getDiplomadoBySlug } from '@/lib/data/diplomadosData';
import { CATALOGO_CURSOS } from '@/lib/data/catalogoGeneral';

function normSlug(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const codigoParam = searchParams.get('codigo')?.trim();
    const slugParam = searchParams.get('slug')?.trim();
    const tipoParam = searchParams.get('tipo')?.trim().toLowerCase(); // 'curso' | 'diplomado' | undefined

    let admin: any = null;
    try {
      admin = createAdminClient();
    } catch (e) {
      console.warn('No se pudo inicializar createAdminClient, usando fallback local:', e);
    }

    // Resolver Código Oficial (DIP-XX, CUR-XX, TAL-XX) de forma estricta (sin caer jamás en DIP-01 por defecto)
    let targetCodigo = codigoParam ? codigoParam.toUpperCase() : '';

    if (!targetCodigo && slugParam) {
      const matchPrefix = slugParam.match(/^(dip|cur|tal)-?(\d+)(?:-|$)/i);
      if (matchPrefix) {
        const pfx = matchPrefix[1].toUpperCase();
        const num = matchPrefix[2].padStart(2, '0');
        targetCodigo = `${pfx}-${num}`;
      } else {
        const slugClean = normSlug(slugParam);

        // 1. Buscar en diplomados_y_cursos de Supabase por id, código o título normalizado
        if (admin) {
          const { data: catRows } = await admin
            .from('diplomados_y_cursos')
            .select('id, codigo, titulo, tipo');
          if (Array.isArray(catRows)) {
            const filtradasPorTipo = tipoParam === 'curso'
              ? catRows.filter((r: any) => r.tipo !== 'diplomado' && !String(r.codigo || '').toUpperCase().startsWith('DIP-'))
              : tipoParam === 'diplomado'
              ? catRows.filter((r: any) => r.tipo === 'diplomado' || String(r.codigo || '').toUpperCase().startsWith('DIP-'))
              : catRows;

            const exactMatch = filtradasPorTipo.find((r: any) =>
              String(r.id || '').toLowerCase() === slugParam.toLowerCase() ||
              String(r.codigo || '').toLowerCase() === slugParam.toLowerCase() ||
              normSlug(r.titulo || '') === slugClean
            );
            if (exactMatch?.codigo) {
              targetCodigo = exactMatch.codigo.toUpperCase();
            }
          }
        }

        // 2. Buscar en catálogo local de cursos/talleres si aplica
        if (!targetCodigo && tipoParam !== 'diplomado') {
          if (slugClean.includes('soft-skills')) targetCodigo = 'TAL-01';
          else if (slugClean.includes('seguridad-basada-en-el-comportamiento')) targetCodigo = 'TAL-02';
          else {
            const curMatch = CATALOGO_CURSOS.find((c) => normSlug(c.titulo) === slugClean || c.codigo.toLowerCase() === slugParam.toLowerCase());
            if (curMatch) targetCodigo = curMatch.codigo.toUpperCase();
          }
        }

        // 3. Buscar coincidencia exacta de slug de diplomado (sin fallback a ALL_DIPLOMADOS[0])
        if (!targetCodigo && tipoParam !== 'curso') {
          const matchedDip = getDiplomadoBySlug(slugParam);
          if (matchedDip && matchedDip.numId) {
            targetCodigo = `DIP-${matchedDip.numId.toString().padStart(2, '0')}`;
          }
        }
      }
    }

    // Salvaguarda: el reproductor de cursos/talleres nunca debe cargar un diplomado (DIP-)
    if (tipoParam === 'curso' && targetCodigo.startsWith('DIP-')) {
      return NextResponse.json({ success: true, tablaCreada: true, total: 0, filas: [] });
    }

    if (admin && targetCodigo) {
      const { data, error } = await admin
        .from('lecciones')
        .select('*')
        .ilike('CodigoDiplomado', targetCodigo)
        .order('orden', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized = data.map(normalizeLeccionRow);
        return NextResponse.json({
          success: true,
          tablaCreada: true,
          total: normalized.length,
          filas: normalized
        });
      }

      // Si targetCodigo está resuelto pero aún no hay filas en lecciones, no devolver otros cursos/diplomados
      if (!error) {
        return NextResponse.json({
          success: true,
          tablaCreada: true,
          total: 0,
          filas: []
        });
      }
    } else if (admin && !slugParam && !codigoParam) {
      const { data, error } = await admin
        .from('lecciones')
        .select('*')
        .order('orden', { ascending: true });
      if (!error && Array.isArray(data) && data.length > 0) {
        const normalized = data.map(normalizeLeccionRow);
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
        if (tipoParam === 'curso' && m.CodigoDiplomado.toUpperCase().startsWith('DIP-')) return false;
        const dipSlug = m.Diplomado.toLowerCase().replace(/[^a-z0-9]/g, '');
        const codSlug = m.CodigoDiplomado.toLowerCase().replace(/[^a-z0-9]/g, '');
        return dipSlug === sLower || codSlug === sLower;
      });
    }

    return NextResponse.json({
      success: true,
      tablaCreada: false,
      total: filtradas.length,
      filas: filtradas,
      aviso: 'Mostrando datos base. Si creaste la tabla lecciones en Supabase, pulsa "Sincronizar Tabla" para guardar los registros permanentemente.'
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
        await admin.from('lecciones').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      // Insertar por lotes de 100 para no sobrecargar el payload
      const batchSize = 100;
      let insertados = 0;

      for (let i = 0; i < filasMaestras.length; i += batchSize) {
        const batch = filasMaestras.slice(i, i + batchSize);
        const { error } = await admin.from('lecciones').insert(batch);
        if (error) {
          throw new Error(`Error al sembrar lote ${i}: ${error.message}`);
        }
        insertados += batch.length;
      }

      return NextResponse.json({
        success: true,
        message: `¡Se sembraron exitosamente ${insertados} lecciones en public.lecciones de Supabase!`,
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
      await admin.from('lecciones').delete().ilike('CodigoDiplomado', cod);
    }

    // Insertar por lotes
    const batchSize = 80;
    let guardados = 0;

    for (let i = 0; i < filasNormalizadas.length; i += batchSize) {
      const batch = filasNormalizadas.slice(i, i + batchSize);
      const { error } = await admin.from('lecciones').insert(batch);
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
      .from('lecciones')
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
      const { error } = await admin.from('lecciones').delete().eq('id', idParam);
      if (error) throw error;
      return NextResponse.json({ success: true, message: `Lección ${idParam} eliminada.` });
    }

    if (codigoParam) {
      const { error } = await admin.from('lecciones').delete().eq('CodigoDiplomado', codigoParam);
      if (error) throw error;
      return NextResponse.json({ success: true, message: `Todas las lecciones de ${codigoParam} eliminadas.` });
    }

    return NextResponse.json({ error: 'Proporciona un id o codigo para eliminar' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
