import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import fs from 'fs';
import path from 'path';

// Cargar y sembrar datos iniciales si Supabase aún no los contiene
async function seedInitialCatalogo(admin: any) {
  try {
    const diplomadosPath = path.join(process.cwd(), 'lib/data/diplomados_todos.json');
    const cursosPath = path.join(process.cwd(), 'lib/data/cursos.json');

    let diplomadosData: any[] = [];
    let cursosData: any[] = [];

    if (fs.existsSync(diplomadosPath)) {
      const raw = fs.readFileSync(diplomadosPath, 'utf-8');
      const parsed = JSON.parse(raw);
      diplomadosData = parsed.diplomados || [];
    }

    if (fs.existsSync(cursosPath)) {
      const raw = fs.readFileSync(cursosPath, 'utf-8');
      cursosData = JSON.parse(raw);
    }

    const itemsToInsert: any[] = [];

    // 1. Sembrar 22 Diplomados Oficiales
    diplomadosData.forEach((d: any, index: number) => {
      const numStr = (index + 1).toString().padStart(2, '0');
      const id = `dip-${numStr}`;
      const codigo = `DIP-${numStr}`;
      const titulo = `${index + 1}. ${d.diplomado}`.toUpperCase();

      const modulosFormateados = (d.modulos || []).map((m: any, mIdx: number) => {
        let nombre = m.nombre || '';
        let docente = m.docente || 'Reginaldo Andía';

        if (!nombre && docente.includes('MÓDULO')) {
          const parts = docente.split(/MÓDULO \d+\s*-\s*/i);
          if (parts.length > 1) {
            docente = parts[0].replace(/Docentes:\s*/i, '').trim();
            nombre = parts[1].trim();
          }
        }

        return {
          codigo: m.codigo || `M${(mIdx + 1).toString().padStart(2, '0')}`,
          nombre: nombre || `MÓDULO ${mIdx + 1}`,
          docente: docente || 'Reginaldo Andía',
          clases: Array.isArray(m.clases) ? m.clases : []
        };
      });

      itemsToInsert.push({
        id,
        codigo,
        version: 'Versión 1',
        ano: 2026,
        titulo,
        tipo: 'diplomado',
        categoria: 'Diplomados Oficiales',
        num_modulos: modulosFormateados.length || 3,
        taller_aplicable: 'Ninguno',
        docente: modulosFormateados[0]?.docente || 'Equipo Docente',
        duracion: '120 horas',
        imagen: '/assets/images/daem/gestion-minera.webp',
        nivel: 'Especialización',
        precio: 150.00,
        modulos: modulosFormateados
      });
    });

    // 2. Sembrar 76 Cursos de Alta Especialización
    const docentesMock = [
      "Ing. Mario Hilasaca", "Dr. Reginaldo Andía", "Mg. Andrea Tejada",
      "Ing. Juan Briones", "Ing. Raul Jacinto", "Lic. Javier Rivera",
      "Ing. Manuel Aucapuri", "Mg. Esteban Hermoza"
    ];

    cursosData.forEach((c: any, index: number) => {
      const numStr = (index + 1).toString().padStart(2, '0');
      const id = `cur-${numStr}`;
      const codigo = `CUR-${numStr}`;
      const docenteAsignado = docentesMock[index % docentesMock.length];

      itemsToInsert.push({
        id,
        codigo,
        version: 'Versión 1',
        ano: 2026,
        titulo: c.curso.toUpperCase(),
        tipo: 'curso',
        categoria: 'Cursos de Alta Especialización',
        num_modulos: 1,
        taller_aplicable: 'Ninguno',
        docente: docenteAsignado,
        duracion: '40 horas',
        imagen: '/assets/images/daem/gestion-minera.webp',
        nivel: 'Especialización',
        precio: 150.00,
        modulos: []
      });
    });

    // 3. Sembrar 2 Talleres
    const talleres = [
      {
        id: 'tal-01',
        codigo: 'TAL-01',
        titulo: 'TALLER DE SOFTSKILLS EN LA INDUSTRIA Y MINERÍA',
        docente: 'Mg. María Jesús Burga'
      },
      {
        id: 'tal-02',
        codigo: 'TAL-02',
        titulo: 'TALLER DE SEGURIDAD BASADA EN EL COMPORTAMIENTO',
        docente: 'Dr. Alberto Mendoza'
      }
    ];

    talleres.forEach((t) => {
      itemsToInsert.push({
        id: t.id,
        codigo: t.codigo,
        version: 'Versión 1',
        ano: 2026,
        titulo: t.titulo,
        tipo: 'taller',
        categoria: 'Talleres',
        num_modulos: 1,
        taller_aplicable: 'Ninguno',
        docente: t.docente,
        duracion: '20 horas',
        imagen: '/assets/images/daem/gestion-minera.webp',
        nivel: 'Práctico',
        precio: 100.00,
        modulos: []
      });
    });

    // Insertar masivamente en Supabase
    if (itemsToInsert.length > 0) {
      await admin.from('cursos').upsert(itemsToInsert, { onConflict: 'id' });
    }
  } catch (e) {
    console.error('Error al sembrar catálogo en Supabase:', e);
  }
}

export async function GET() {
  try {
    const admin = createAdminClient();
    let { data: cursos, error } = await admin
      .from('cursos')
      .select('*')
      .order('codigo', { ascending: true });

    if (error) {
      return NextResponse.json({ cursos: [], error: error.message }, { status: 500 });
    }

    // Si la tabla está vacía, sembrar catálogo completo de 22 diplomados, 76 cursos y 2 talleres
    if (!cursos || cursos.length === 0) {
      await seedInitialCatalogo(admin);
      const res = await admin.from('cursos').select('*').order('codigo', { ascending: true });
      cursos = res.data || [];
    }

    // Separar por categorías
    const diplomados = (cursos || []).filter(c => c.tipo === 'diplomado' || c.categoria === 'Diplomados Oficiales');
    const cursosEspecializacion = (cursos || []).filter(c => c.tipo === 'curso' || c.categoria === 'Cursos de Alta Especialización');
    const talleres = (cursos || []).filter(c => c.tipo === 'taller' || c.categoria === 'Talleres');

    return NextResponse.json({
      cursos: cursos || [],
      diplomados,
      cursosEspecializacion,
      talleres,
      totales: {
        diplomados: diplomados.length,
        cursos: cursosEspecializacion.length,
        talleres: talleres.length
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener catálogo' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, codigo, version, ano, titulo, tipo, categoria, 
      num_modulos, taller_aplicable, docente, precio, modulos 
    } = body;

    if (!titulo) {
      return NextResponse.json({ error: 'El título del programa es requerido' }, { status: 400 });
    }

    const admin = createAdminClient();

    const tipoNormalizado = tipo || (categoria === 'Diplomados Oficiales' ? 'diplomado' : categoria === 'Talleres' ? 'taller' : 'curso');
    const codigoGen = codigo ? codigo.toUpperCase() : (tipoNormalizado === 'diplomado' ? 'DIP-99' : tipoNormalizado === 'taller' ? 'TAL-99' : 'CUR-99');
    const idGen = id || `${tipoNormalizado}-${codigoGen.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    const productoData = {
      id: idGen,
      codigo: codigoGen,
      version: version || 'Versión 1',
      ano: Number(ano) || 2026,
      titulo: titulo.toUpperCase(),
      tipo: tipoNormalizado,
      categoria: categoria || (tipoNormalizado === 'diplomado' ? 'Diplomados Oficiales' : tipoNormalizado === 'taller' ? 'Talleres' : 'Cursos de Alta Especialización'),
      num_modulos: Number(num_modulos) || (modulos ? modulos.length : 3),
      taller_aplicable: taller_aplicable || 'Ninguno',
      docente: docente || 'Reginaldo Andía',
      duracion: tipoNormalizado === 'diplomado' ? '120 horas' : '40 horas',
      imagen: '/assets/images/daem/gestion-minera.webp',
      nivel: 'Especialización',
      precio: Number(precio) || 150.00,
      modulos: Array.isArray(modulos) ? modulos : []
    };

    const { data, error } = await admin
      .from('cursos')
      .upsert(productoData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Error en Supabase: ${error.message}` }, { status: 500 });
    }

    // Registrar en Audit Logs
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: `CREAR_PRODUCTO_${tipoNormalizado.toUpperCase()}`,
        detalles: { id: data.id, titulo: data.titulo, codigo: data.codigo }
      });
    } catch (e: any) {
      console.error(e);
    }

    return NextResponse.json({ success: true, producto: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { 
      id, codigo, version, ano, titulo, num_modulos, 
      taller_aplicable, docente, precio, modulos 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido para actualizar' }, { status: 400 });
    }

    const admin = createAdminClient();

    const updateFields: any = {};
    if (codigo !== undefined) updateFields.codigo = codigo.toUpperCase();
    if (version !== undefined) updateFields.version = version;
    if (ano !== undefined) updateFields.ano = Number(ano);
    if (titulo !== undefined) updateFields.titulo = titulo.toUpperCase();
    if (num_modulos !== undefined) updateFields.num_modulos = Number(num_modulos);
    if (taller_aplicable !== undefined) updateFields.taller_aplicable = taller_aplicable;
    if (docente !== undefined) updateFields.docente = docente;
    if (precio !== undefined) updateFields.precio = Number(precio);
    if (modulos !== undefined) {
      updateFields.modulos = modulos;
      updateFields.num_modulos = modulos.length;
    }

    const { data, error } = await admin
      .from('cursos')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Error al actualizar en Supabase: ${error.message}` }, { status: 500 });
    }

    // Auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: 'EDITAR_PRODUCTO_CATALOGO',
        detalles: { id, titulo: data.titulo, modulosCount: Array.isArray(data.modulos) ? data.modulos.length : 0 }
      });
    } catch (e: any) {
      console.error(e);
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

    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: 'ELIMINAR_PRODUCTOS_CATALOGO',
        detalles: { ids_eliminados: ids }
      });
    } catch (e: any) {
      console.error(e);
    }

    return NextResponse.json({ success: true, eliminados: ids.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
