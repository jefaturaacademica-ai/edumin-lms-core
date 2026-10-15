import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ALL_DIPLOMADOS } from '@/lib/data/diplomadosData';
import { 
  LeccionRow, 
  normalizeLeccionRow, 
  convertirFilasAListaModulos, 
  convertirModulosALeccionRows,
  generarFilasMaestrasIniciales
} from '@/lib/data/diplomadosLeccionesService';
import fs from 'fs';
import path from 'path';

// Helper para limpiar y formatear datos locales
function getLocalCatalogoData() {
  const diplomadosPath = path.join(process.cwd(), 'lib/data/diplomados_todos.json');
  const cursosPath = path.join(process.cwd(), 'lib/data/cursos.json');

  let diplomadosData: any[] = [];
  let cursosData: any[] = [];

  if (fs.existsSync(diplomadosPath)) {
    try {
      const raw = fs.readFileSync(diplomadosPath, 'utf-8');
      const parsed = JSON.parse(raw);
      diplomadosData = parsed.diplomados || [];
    } catch (e) {
      console.error(e);
    }
  }

  if (fs.existsSync(cursosPath)) {
    try {
      const raw = fs.readFileSync(cursosPath, 'utf-8');
      cursosData = JSON.parse(raw);
    } catch (e) {
      console.error(e);
    }
  }

  const diplomadosFormateados: any[] = [];
  const cursosFormateados: any[] = [];
  const talleresFormateados: any[] = [];

  // 1. 22 Diplomados
  diplomadosData.forEach((d: any, index: number) => {
    const numStr = (index + 1).toString().padStart(2, '0');
    const id = `dip-${numStr}`;
    const codigo = `DIP-${numStr}`;
    const titulo = (d.diplomado || '').trim().toUpperCase();

    // Contador secuencial de clases continuo a lo largo de todo el diplomado
    let contadorClaseGlobal = 1;

    const modulosFormateados = (d.modulos || []).map((m: any, mIdx: number) => {
      let nombre = (m.nombre || '').trim();
      let docente = (m.docente || '').trim();

      if (!nombre && docente.includes('MÓDULO')) {
        const parts = docente.split(/MÓDULO \d+\s*-\s*/i);
        if (parts.length > 1) {
          docente = parts[0].replace(/Docentes:\s*/i, '').trim();
          nombre = parts[1].trim();
        }
      }

      // Código de Módulo formateado como "Módulo 01", "Módulo 02", etc.
      const codigoModulo = `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`;

      // Clases numeradas secuencialmente (ej. Clase 1, Clase 2... Módulo 2 empieza en Clase 4, etc.)
      const clasesFormat = (Array.isArray(m.clases) ? m.clases : []).map((claseItem: any) => {
        const numClase = contadorClaseGlobal;
        contadorClaseGlobal += 1;
        const isObj = typeof claseItem === 'object' && claseItem !== null;
        const rawTitle = isObj ? (claseItem.titulo || '') : String(claseItem);
        const nombreLimpio = rawTitle.replace(/^Clase \d+:\s*/i, '').replace(/^Clase \d+ - \s*/i, '').trim();
        const tituloFormateado = `Clase ${numClase}: ${nombreLimpio || 'Nueva Clase'}`;

        if (isObj) {
          return {
            ...claseItem,
            titulo: tituloFormateado
          };
        }

        return tituloFormateado;
      });

      // Procesar temas limpios si existen
      const temasFormat = (Array.isArray(m.temas) ? m.temas : []).map((tObj: any, tIdx: number) => {
        const numTemaStr = (tIdx + 1) < 10 ? `0${tIdx + 1}` : `${tIdx + 1}`;
        const rawTit = tObj.titulo || `Tema ${numTemaStr}`;
        const temaLimpio = rawTit
          .replace(/^Tema\s*\d+[:\-\s]*/i, '')
          .replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '')
          .trim();
        return {
          titulo: `Tema ${numTemaStr}: ${temaLimpio}`,
          clases: Array.isArray(tObj.clases) ? tObj.clases : []
        };
      });

      return {
        codigo: codigoModulo,
        nombre: nombre || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`,
        docente: docente,
        temas: temasFormat,
        clases: clasesFormat,
        clasesAdicionales: Array.isArray(m.clasesAdicionales) && m.clasesAdicionales.length > 0
          ? m.clasesAdicionales
          : [
              {
                titulo: 'Clase Adicional: Sesión Especial de Refuerzo y Casuística Práctica',
                videoUrl: ''
              }
            ]
      };
    });

    const docentesList = Array.from(new Set(modulosFormateados.map((m: any) => m.docente).filter(Boolean)));
    const docenteDiplomado = docentesList.length > 0 ? docentesList.join(', ') : '';

    diplomadosFormateados.push({
      id,
      codigo,
      version: 'Versión 1',
      ano: 2026,
      titulo,
      tipo: 'diplomado',
      categoria: 'Diplomados Oficiales',
      num_modulos: modulosFormateados.length || 3,
      taller_aplicable: 'Ninguno',
      docente: docenteDiplomado,
      duracion: '120 horas',
      imagen: ALL_DIPLOMADOS[index]?.imagen || '/assets/images/daem/gestion-minera.webp',
      nivel: 'Especialización',
      precio: 150.00,
      modulos: modulosFormateados
    });
  });

  // 2. 76 Cursos de Alta Especialización
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

    cursosFormateados.push({
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

  // 3. 2 Talleres
  talleresFormateados.push(
    {
      id: 'tal-01',
      codigo: 'TAL-01',
      version: 'Versión 1',
      ano: 2026,
      titulo: 'TALLER DE SOFTSKILLS EN LA INDUSTRIA Y MINERÍA',
      tipo: 'taller',
      categoria: 'Talleres',
      num_modulos: 1,
      taller_aplicable: 'Ninguno',
      docente: 'Mg. María Jesús Burga',
      duracion: '20 horas',
      imagen: '/assets/images/daem/gestion-minera.webp',
      nivel: 'Práctico',
      precio: 100.00,
      modulos: []
    },
    {
      id: 'tal-02',
      codigo: 'TAL-02',
      version: 'Versión 1',
      ano: 2026,
      titulo: 'TALLER DE SEGURIDAD BASADA EN EL COMPORTAMIENTO',
      tipo: 'taller',
      categoria: 'Talleres',
      num_modulos: 1,
      taller_aplicable: 'Ninguno',
      docente: 'Dr. Alberto Mendoza',
      duracion: '20 horas',
      imagen: '/assets/images/daem/gestion-minera.webp',
      nivel: 'Práctico',
      precio: 100.00,
      modulos: []
    }
  );

  return {
    diplomados: diplomadosFormateados,
    cursosEspecializacion: cursosFormateados,
    talleres: talleresFormateados,
    todos: [...diplomadosFormateados, ...cursosFormateados, ...talleresFormateados]
  };
}

// Sembrar masivamente en Supabase public.cursos con soporte total para columnas existentes o fallback
async function seedInitialCatalogo(admin: any) {
  try {
    const local = getLocalCatalogoData();
    const items = local.todos;

    // 1. Intentar upsert completo con todas las columnas avanzadas
    const { error: fullError } = await admin.from('cursos').upsert(items, { onConflict: 'id' });

    if (fullError) {
      console.warn('Upsert completo rechazado por Supabase (faltan columnas):', fullError.message);
      
      // 2. Fallback garantizado: Insertar objetos con solo las columnas estándar que ya existen en Supabase Table Editor (id, titulo, categoria, duracion, imagen, nivel, precio)
      const basicItems = items.map(i => ({
        id: i.id,
        titulo: i.titulo,
        categoria: i.categoria,
        duracion: i.duracion,
        imagen: i.imagen,
        nivel: i.nivel,
        precio: i.precio
      }));

      const { error: basicError } = await admin.from('cursos').upsert(basicItems, { onConflict: 'id' });
      if (basicError) {
        console.error('Error al insertar esquema básico en Supabase:', basicError.message);
        return false;
      }
    }
    return true;
  } catch (e) {
    console.error('Error al sembrar catálogo en Supabase:', e);
    return false;
  }
}

// Helper para ordenar códigos DIP-01 .. DIP-22 naturalmente
function parseCodeNumber(code: string): number {
  const match = (code || '').match(/\d+/);
  return match ? parseInt(match[0], 10) : 999;
}

// Sincroniza filas de un diplomado en la tabla diplomados_lecciones de forma atómica y segura
async function syncLeccionesEnSupabase(admin: any, codigoDiplomado: string, rows: LeccionRow[]) {
  if (!codigoDiplomado || !Array.isArray(rows) || rows.length === 0) {
    console.warn('syncLeccionesEnSupabase: Omitido porque no hay filas válidas para guardar de', codigoDiplomado);
    return;
  }

  try {
    // 1. Normalizar filas limpiando IDs arbitrarios para que Supabase use gen_random_uuid()
    const filasLimpias = rows.map((r, idx) => {
      const norm = normalizeLeccionRow(r);
      return {
        ...norm,
        orden: norm.orden || idx + 1
      };
    });

    // 2. Eliminar lecciones anteriores de este diplomado específico
    const { error: delError } = await admin
      .from('diplomados_lecciones')
      .delete()
      .ilike('CodigoDiplomado', codigoDiplomado);

    if (delError) {
      console.warn('Aviso al eliminar lecciones previas en diplomados_lecciones:', delError.message);
    }

    // 3. Insertar nuevas lecciones en bloques seguros
    const chunkSize = 80;
    for (let i = 0; i < filasLimpias.length; i += chunkSize) {
      const batch = filasLimpias.slice(i, i + chunkSize);
      const { error: insError } = await admin.from('diplomados_lecciones').insert(batch);
      if (insError) {
        console.error(`Error al insertar lote ${i} en diplomados_lecciones:`, insError.message);
      }
    }
  } catch (err: any) {
    console.error('Error al sincronizar diplomados_lecciones:', err.message);
  }
}

// Reconstruye diplomados con su estructura completa directamente desde las filas de diplomados_lecciones
// Garantiza que los 22 diplomados oficiales SIEMPRE se preserven y nunca desaparezcan del catálogo
function reconstruirDiplomadosDesdeLecciones(leccionesRows: any[], cursosSupabase: any[], localDiplomados: any[]) {
  const filasPorCodigo = new Map<string, LeccionRow[]>();

  for (const row of (leccionesRows || [])) {
    const norm = normalizeLeccionRow(row);
    const cod = (norm.CodigoDiplomado || 'DIP-01').toUpperCase();
    if (!filasPorCodigo.has(cod)) {
      filasPorCodigo.set(cod, []);
    }
    filasPorCodigo.get(cod)!.push(norm);
  }

  // Obtenemos todos los 22 códigos oficiales para asegurar que ninguno desaparezca
  const codigosOficiales = Array.from(new Set([
    ...localDiplomados.map((d: any) => d.codigo?.toUpperCase()).filter(Boolean),
    ...Array.from(filasPorCodigo.keys())
  ])).sort((a, b) => parseCodeNumber(a) - parseCodeNumber(b));

  return codigosOficiales.map((cod, idx) => {
    let rows = filasPorCodigo.get(cod) || [];

    // Si por alguna razón este diplomado no tenía filas en BD, recuperar sus filas maestras por seguridad
    if (rows.length === 0) {
      const maestras = generarFilasMaestrasIniciales().filter(m => m.CodigoDiplomado.toUpperCase() === cod);
      rows = maestras;
    }

    const firstRow = rows[0] || ({} as LeccionRow);
    const modulos = convertirFilasAListaModulos(rows);

    const docentesList = Array.from(new Set(rows.map(r => r.Docente).filter(Boolean)));
    const docenteDiplomado = docentesList.length > 0 ? docentesList.join(', ') : 'Reginaldo Andía';

    const numDigits = cod.replace(/[^0-9]/g, '');
    const id = `dip-${numDigits.padStart(2, '0')}`;

    // Buscar metadata en public.cursos si existe, priorizando ID oficial estándar (ej. dip-01) y evitando IDs duplicados (dip-dip)
    const cursoExistente = (cursosSupabase || []).find((c: any) => c.id === id) ||
      (cursosSupabase || []).find((c: any) => (c.codigo && c.codigo.toUpperCase() === cod.toUpperCase()) && !c.id.includes('dip-dip'));

    // Buscar metadata en local si existe
    const localDip = (localDiplomados || []).find((d: any) => 
      d.codigo?.toUpperCase() === cod.toUpperCase() || 
      d.id === id
    );

    const esSoloCodigo = (t: string | undefined | null) => {
      if (!t) return true;
      const clean = t.trim().toUpperCase();
      return clean === cod || clean === `DIPLOMADO ${cod}` || (/^DIP-\d+$/i.test(clean));
    };

    let titulo = '';
    if (!esSoloCodigo(firstRow.Diplomado)) {
      titulo = firstRow.Diplomado.trim().toUpperCase();
    } else if (cursoExistente && !esSoloCodigo(cursoExistente.titulo)) {
      titulo = cursoExistente.titulo.trim().toUpperCase();
    } else if (localDip && !esSoloCodigo(localDip.titulo)) {
      titulo = localDip.titulo.trim().toUpperCase();
    } else {
      titulo = (firstRow.Diplomado || `DIPLOMADO ${cod}`).trim().toUpperCase();
    }

    return {
      id: cursoExistente?.id || id,
      codigo: cod,
      version: cursoExistente?.version || localDip?.version || 'Versión 1',
      ano: cursoExistente?.ano || localDip?.ano || 2026,
      titulo,
      tipo: 'diplomado',
      categoria: 'Diplomados Oficiales',
      num_modulos: modulos.length || cursoExistente?.num_modulos || 3,
      taller_aplicable: cursoExistente?.taller_aplicable || 'Ninguno',
      docente: docenteDiplomado,
      duracion: cursoExistente?.duracion || localDip?.duracion || '120 horas',
      imagen: cursoExistente?.imagen || localDip?.imagen || ALL_DIPLOMADOS[idx]?.imagen || '/assets/images/daem/gestion-minera.webp',
      nivel: cursoExistente?.nivel || localDip?.nivel || 'Especialización',
      precio: cursoExistente?.precio || localDip?.precio || 150.00,
      modulos
    };
  });
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const local = getLocalCatalogoData();

    // 1. Consultar cursos y talleres desde public.cursos
    let { data: cursos, error } = await admin
      .from('cursos')
      .select('*');

    // Si la tabla en Supabase tiene menos de 10 productos o dio error, sembrar automáticamente
    if (error || !cursos || cursos.length < 10) {
      await seedInitialCatalogo(admin);
      const res = await admin.from('cursos').select('*');
      if (res.data && res.data.length >= 10) {
        cursos = res.data;
      } else {
        cursos = local.todos;
      }
    }

    // 2. Consultar diplomados directamente desde public.diplomados_lecciones
    const { data: leccionesRows, error: leccionesError } = await admin
      .from('diplomados_lecciones')
      .select('*')
      .order('orden', { ascending: true });

    let diplomados: any[] = [];
    if (!leccionesError && Array.isArray(leccionesRows) && leccionesRows.length > 0) {
      diplomados = reconstruirDiplomadosDesdeLecciones(leccionesRows, cursos, local.diplomados);
    } else {
      diplomados = local.diplomados;
    }

    // 3. Mapear Cursos de Especialización y Talleres desde public.cursos
    const otrosCursosMapeados = (cursos || []).filter((c: any) => {
      const tipo = c.tipo || (c.categoria === 'Diplomados Oficiales' || (c.id && c.id.startsWith('dip-')) ? 'diplomado' : c.categoria === 'Talleres' || (c.id && c.id.startsWith('tal-')) ? 'taller' : 'curso');
      return tipo !== 'diplomado';
    }).map((c: any, index: number) => {
      let tipo = c.tipo;
      if (!tipo) {
        if (c.categoria === 'Talleres' || (c.id && c.id.startsWith('tal-'))) tipo = 'taller';
        else tipo = 'curso';
      }

      const localItem = local.todos.find(item => item.id === c.id || item.titulo === c.titulo);

      return {
        id: c.id,
        codigo: c.codigo || localItem?.codigo || (tipo === 'taller' ? `TAL-${(index + 1).toString().padStart(2, '0')}` : `CUR-${(index + 1).toString().padStart(2, '0')}`),
        version: c.version || localItem?.version || 'Versión 1',
        ano: c.ano || localItem?.ano || 2026,
        titulo: c.titulo,
        tipo,
        categoria: c.categoria || localItem?.categoria || (tipo === 'taller' ? 'Talleres' : 'Cursos de Alta Especialización'),
        num_modulos: c.num_modulos || localItem?.num_modulos || 1,
        taller_aplicable: c.taller_aplicable || localItem?.taller_aplicable || 'Ninguno',
        docente: c.docente || localItem?.docente || 'Por asignar',
        duracion: c.duracion || (tipo === 'taller' ? '20 horas' : '40 horas'),
        imagen: c.imagen || '/assets/images/daem/gestion-minera.webp',
        nivel: c.nivel || (tipo === 'taller' ? 'Práctico' : 'Especialización'),
        precio: c.precio || (tipo === 'taller' ? 100.00 : 150.00),
        modulos: (c.modulos && Array.isArray(c.modulos) && c.modulos.length > 0) ? c.modulos : (localItem?.modulos || [])
      };
    });

    const cursosEspecializacion = otrosCursosMapeados.filter(c => c.tipo === 'curso');
    const talleres = otrosCursosMapeados.filter(c => c.tipo === 'taller');

    const todos = [
      ...diplomados,
      ...(cursosEspecializacion.length > 0 ? cursosEspecializacion : local.cursosEspecializacion),
      ...(talleres.length > 0 ? talleres : local.talleres)
    ];

    return NextResponse.json({
      cursos: todos,
      diplomados: diplomados.length > 0 ? diplomados : local.diplomados,
      cursosEspecializacion: cursosEspecializacion.length > 0 ? cursosEspecializacion : local.cursosEspecializacion,
      talleres: talleres.length > 0 ? talleres : local.talleres,
      totales: {
        diplomados: diplomados.length || local.diplomados.length,
        cursos: cursosEspecializacion.length || local.cursosEspecializacion.length,
        talleres: talleres.length || local.talleres.length
      }
    });
  } catch (err: any) {
    const local = getLocalCatalogoData();
    return NextResponse.json({
      cursos: local.todos,
      diplomados: local.diplomados,
      cursosEspecializacion: local.cursosEspecializacion,
      talleres: local.talleres,
      error: err.message
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    // Acción especial: Forzar sembrado masivo a Supabase
    if (body.action === 'seed') {
      await seedInitialCatalogo(admin);
      const res = await admin.from('cursos').select('*');
      const local = getLocalCatalogoData();

      const rawList = (res.data && res.data.length >= 10) ? res.data : local.todos;

      // Asegurar que diplomados_lecciones también tenga datos
      const { count: leccCount } = await admin.from('diplomados_lecciones').select('*', { count: 'exact', head: true });
      if (!leccCount || leccCount === 0) {
        const maestras = generarFilasMaestrasIniciales();
        for (let i = 0; i < maestras.length; i += 80) {
          await admin.from('diplomados_lecciones').insert(maestras.slice(i, i + 80));
        }
      }

      // Reconstruir diplomados desde diplomados_lecciones
      const { data: leccRows } = await admin.from('diplomados_lecciones').select('*').order('orden', { ascending: true });
      const diplomados = (leccRows && leccRows.length > 0)
        ? reconstruirDiplomadosDesdeLecciones(leccRows, rawList, local.diplomados)
        : local.diplomados;

      const cursosMapeados = rawList.map((c: any, index: number) => {
        let tipo = c.tipo;
        if (!tipo) {
          if (c.categoria === 'Diplomados Oficiales' || (c.id && c.id.startsWith('dip-'))) tipo = 'diplomado';
          else if (c.categoria === 'Talleres' || (c.id && c.id.startsWith('tal-'))) tipo = 'taller';
          else tipo = 'curso';
        }

        const localItem = local.todos.find(item => item.id === c.id || item.titulo === c.titulo);

        return {
          id: c.id,
          codigo: c.codigo || localItem?.codigo || (tipo === 'diplomado' ? `DIP-${(index + 1).toString().padStart(2, '0')}` : tipo === 'taller' ? `TAL-${(index + 1).toString().padStart(2, '0')}` : `CUR-${(index + 1).toString().padStart(2, '0')}`),
          version: c.version || localItem?.version || 'Versión 1',
          ano: c.ano || localItem?.ano || 2026,
          titulo: c.titulo,
          tipo,
          categoria: c.categoria || localItem?.categoria,
          num_modulos: c.num_modulos || localItem?.num_modulos || 3,
          taller_aplicable: c.taller_aplicable || localItem?.taller_aplicable || 'Ninguno',
          docente: c.docente || localItem?.docente || 'Por asignar',
          duracion: c.duracion || '40 horas',
          precio: c.precio || 150.00,
          modulos: (c.modulos && Array.isArray(c.modulos) && c.modulos.length > 0) ? c.modulos : (localItem?.modulos || [])
        };
      });

      const cursosEspecializacion = cursosMapeados.filter(c => c.tipo === 'curso');
      const talleres = cursosMapeados.filter(c => c.tipo === 'taller');

      return NextResponse.json({
        success: true,
        message: 'Catálogo de 100 productos sembrado exitosamente en Supabase.',
        diplomados: diplomados.length > 0 ? diplomados : local.diplomados,
        cursosEspecializacion: cursosEspecializacion.length > 0 ? cursosEspecializacion : local.cursosEspecializacion,
        talleres: talleres.length > 0 ? talleres : local.talleres
      });
    }

    const { 
      id, codigo, version, ano, titulo, tipo, categoria, 
      num_modulos, taller_aplicable, docente, precio, modulos 
    } = body;

    if (!titulo) {
      return NextResponse.json({ error: 'El título del programa es requerido' }, { status: 400 });
    }

    const tipoNormalizado = tipo || (categoria === 'Diplomados Oficiales' ? 'diplomado' : categoria === 'Talleres' ? 'taller' : 'curso');
    const codigoGen = codigo ? codigo.toUpperCase() : (tipoNormalizado === 'diplomado' ? 'DIP-99' : tipoNormalizado === 'taller' ? 'TAL-99' : 'CUR-99');
    const numDigits = codigoGen.replace(/[^0-9]/g, '');
    const idGen = id || (tipoNormalizado === 'diplomado' && numDigits ? `dip-${numDigits.padStart(2, '0')}` : `${tipoNormalizado}-${codigoGen.toLowerCase().replace(/[^a-z0-9]/g, '')}`);

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

    let { data, error } = await admin
      .from('cursos')
      .upsert(productoData)
      .select()
      .maybeSingle();

    if (error) {
      // Fallback a columnas estándar de Supabase
      const basicData = {
        id: productoData.id,
        titulo: productoData.titulo,
        categoria: productoData.categoria,
        duracion: productoData.duracion,
        imagen: productoData.imagen,
        nivel: productoData.nivel,
        precio: productoData.precio
      };
      const basicRes = await admin.from('cursos').upsert(basicData).select().maybeSingle();
      data = basicRes.data || productoData;
    }

    // Si es un diplomado y no se solicitó omitir la sincronización (ej. durante importación masiva directa de filas)
    if (!body.skipSyncLecciones && tipoNormalizado === 'diplomado' && Array.isArray(modulos) && modulos.length > 0) {
      const leccionRows = convertirModulosALeccionRows(codigoGen, titulo.toUpperCase(), modulos);
      await syncLeccionesEnSupabase(admin, codigoGen, leccionRows);
    }

    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: `CREAR_PRODUCTO_${tipoNormalizado.toUpperCase()}`,
        detalles: { id: data?.id || idGen, titulo: data?.titulo || titulo, codigo: codigoGen }
      });
    } catch (e: any) {
      console.error(e);
    }

    return NextResponse.json({ success: true, producto: data || productoData });
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

    let { data, error } = await admin
      .from('cursos')
      .update(updateFields)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      // Fallback básico
      const basicFields: any = {};
      if (titulo !== undefined) basicFields.titulo = titulo.toUpperCase();
      if (precio !== undefined) basicFields.precio = Number(precio);

      const basicRes = await admin.from('cursos').update(basicFields).eq('id', id).select().maybeSingle();
      data = basicRes.data || { id, ...updateFields };
    }

    // Si es un diplomado y se proporcionaron módulos, sincronizar la tabla diplomados_lecciones
    if (modulos !== undefined && Array.isArray(modulos)) {
      const { data: cursoActual } = await admin.from('cursos').select('*').eq('id', id).maybeSingle();
      const cod = (codigo || cursoActual?.codigo || (id.startsWith('dip-') ? `DIP-${id.replace(/[^0-9]/g, '').padStart(2, '0')}` : 'DIP-99')).toUpperCase();
      const tit = (titulo || cursoActual?.titulo || 'DIPLOMADO').toUpperCase();
      const tipoProd = cursoActual?.tipo || (id.startsWith('dip-') ? 'diplomado' : 'curso');

      if (tipoProd === 'diplomado' || id.startsWith('dip-')) {
        const leccionRows = convertirModulosALeccionRows(cod, tit, modulos);
        await syncLeccionesEnSupabase(admin, cod, leccionRows);
      }
    }

    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: 'EDITAR_PRODUCTO_CATALOGO',
        detalles: { id, titulo: data?.titulo || titulo, modulosCount: Array.isArray(modulos) ? modulos.length : 0 }
      });
    } catch (e: any) {
      console.error(e);
    }

    return NextResponse.json({ success: true, producto: data || { id, ...updateFields } });
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
      console.error('Error al eliminar de Supabase:', error.message);
    }

    // Eliminar también lecciones asociadas en diplomados_lecciones si son diplomados
    for (const idItem of ids) {
      if (typeof idItem === 'string' && idItem.toLowerCase().startsWith('dip-')) {
        const num = idItem.replace(/[^0-9]/g, '');
        const code = `DIP-${num.padStart(2, '0')}`;
        await admin.from('diplomados_lecciones').delete().ilike('CodigoDiplomado', code);
      }
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
