import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: cursos, error } = await admin
      .from('cursos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ cursos: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cursos: cursos || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener catálogo' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, codigo, titulo, tipo, categoria, duracion, imagen, nivel, precio } = body;

    if (!titulo || !id) {
      return NextResponse.json({ error: 'Título e ID son requeridos' }, { status: 400 });
    }

    const admin = createAdminClient();

    const cursoData = {
      id: id.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      titulo: titulo.toUpperCase(),
      categoria: categoria || (tipo === 'diplomado' ? 'Diplomados Oficiales' : 'Cursos de Alta Especialización'),
      duracion: duracion || (tipo === 'diplomado' ? '120 horas' : '40 horas'),
      imagen: imagen || '/assets/images/daem/gestion-minera.webp',
      nivel: nivel || 'Especialización',
      precio: Number(precio) || 150.00
    };

    const { data, error } = await admin
      .from('cursos')
      .upsert(cursoData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Error en Supabase: ${error.message}` }, { status: 500 });
    }

    // Registrar en Audit Logs de Supabase
    await admin.from('audit_logs').insert({
      accion: `CREAR_PRODUCTO_${(tipo || 'CURSO').toUpperCase()}`,
      detalles: { id: data.id, titulo: data.titulo, codigo }
    });

    return NextResponse.json({ success: true, producto: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, titulo, categoria, duracion, imagen, nivel, precio } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido para actualizar' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data, error } = await admin
      .from('cursos')
      .update({
        titulo: titulo ? titulo.toUpperCase() : undefined,
        categoria,
        duracion,
        imagen,
        nivel,
        precio: precio !== undefined ? Number(precio) : undefined
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Error al actualizar en Supabase: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, producto: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'Proporciona una lista de IDs a eliminar' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { error } = await admin
      .from('cursos')
      .delete()
      .in('id', ids);

    if (error) {
      return NextResponse.json({ error: `Error al eliminar de Supabase: ${error.message}` }, { status: 500 });
    }

    await admin.from('audit_logs').insert({
      accion: 'ELIMINAR_PRODUCTOS_CATALOGO',
      detalles: { ids_eliminados: ids }
    });

    return NextResponse.json({ success: true, eliminados: ids.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
