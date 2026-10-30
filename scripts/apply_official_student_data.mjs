import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const rawDips = JSON.parse(fs.readFileSync('lib/data/diplomados_todos.json', 'utf8'));
const diplomadosOficiales = rawDips.diplomados || [];

function cleanAlpha(str) {
  if (!str) return '';
  return str
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function toOfficialSlug(title) {
  return title
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseList(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    const clean = field.replace(/^(DIPLOMADOS_LIST|CURSOS_LIST)\|/, '').trim();
    try {
      return JSON.parse(clean);
    } catch (e) {
      return [];
    }
  }
  return [];
}

async function applyOfficialStudentData() {
  console.log('=== APLICANDO DIPLOMADOS Y CURSOS 100% OFICIALES A TODOS LOS ESTUDIANTES ===\n');

  const { data: dbCursos, error: errCursos } = await sb
    .from('diplomados_y_cursos')
    .select('id, codigo, titulo, tipo')
    .or('tipo.eq.curso,codigo.ilike.CUR-%')
    .order('codigo');

  if (errCursos || !dbCursos) {
    console.error('Error al obtener cursos oficiales:', errCursos);
    return;
  }

  const { data: profiles, error: errProfiles } = await sb.from('profiles').select('*');

  if (errProfiles || !profiles) {
    console.error('Error al obtener perfiles:', errProfiles);
    return;
  }

  let actualizados = 0;

  for (const p of profiles) {
    const dips = parseList(p.diplomados);
    const curs = parseList(p.cursos);

    // 1. Normalizar Diplomados oficiales
    const newDips = dips.map(d => {
      const match = diplomadosOficiales.find(of => {
        const c1 = cleanAlpha(d.titulo);
        const c2 = cleanAlpha(d.slug || d.id);
        const cOf = cleanAlpha(of.diplomado);
        return c1 === cOf || c2 === cOf || cOf.includes(c1) || c1.includes(cOf);
      });

      if (!match) {
        console.warn(`⚠️ Diplomado no oficial detectado para ${p.dni_ce}: "${d.titulo}"`);
        return d;
      }

      const cleanSlug = toOfficialSlug(match.diplomado);
      const officialModulos = (match.modulos || []).map((m, mIdx) => {
        const codMod = `Módulo ${String(mIdx + 1).padStart(2, '0')}`;
        let nomMod = (m.nombre || '').trim();
        if (!nomMod && m.docente && m.docente.includes('MÓDULO')) {
          const parts = m.docente.split(/MÓDULO \d+\s*-\s*/i);
          if (parts.length > 1) nomMod = parts[1].trim();
        }

        const prevMod = (d.modulos || []).find((pm, pIdx) => 
          (pm.codigo && pm.codigo.toLowerCase() === codMod.toLowerCase()) ||
          pIdx === mIdx
        );

        return {
          id: codMod,
          codigo: codMod,
          nombre: nomMod || codMod,
          nota: prevMod?.nota ?? 0,
          completado: Boolean(prevMod?.completado),
          ...(prevMod?.rendido ? { rendido: prevMod.rendido } : {}),
          ...(prevMod?.codigo_cert ? { codigo_cert: prevMod.codigo_cert } : {}),
          ...(prevMod?.fecha ? { fecha: prevMod.fecha } : {}),
          ...(prevMod?.horas ? { horas: prevMod.horas } : {})
        };
      });

      return {
        id: cleanSlug,
        slug: cleanSlug,
        titulo: match.diplomado.trim().toUpperCase(),
        avance: d.avance ?? 0,
        completado: Boolean(d.completado),
        completadosMap: d.completadosMap || {},
        modulos: officialModulos
      };
    });

    // 2. Normalizar Cursos oficiales
    const newCursos = curs.map((c, idx) => {
      let num = idx + 1;
      if (c.id && /^cur-\d+$/i.test(c.id)) {
        num = parseInt(c.id.replace(/[^0-9]/g, ''), 10);
      }
      const codStr = `CUR-${String(num).padStart(2, '0')}`;
      const officialCurso = dbCursos.find(of => of.codigo === codStr);

      const officialTitle = officialCurso ? officialCurso.titulo : c.titulo;

      return {
        id: `cur-${String(num).padStart(2, '0')}`,
        codigo: codStr,
        titulo: officialTitle,
        nota: c.nota ?? 0,
        completado: Boolean(c.completado),
        avance: c.avance ?? (c.completado ? 100 : 0),
        completadosMap: c.completadosMap || {}
      };
    });

    // Serializar
    const diplomadosSerialized = `DIPLOMADOS_LIST|${JSON.stringify(newDips)}`;
    const cursosSerialized = `CURSOS_LIST|${JSON.stringify(newCursos)}`;

    // Actualizar en Supabase
    const { error: updErr } = await sb
      .from('profiles')
      .update({
        diplomados: diplomadosSerialized,
        cursos: cursosSerialized
      })
      .eq('id', p.id);

    if (updErr) {
      console.error(`❌ Error actualizando ${p.dni_ce}:`, updErr.message);
    } else {
      actualizados++;
      console.log(`✅ ${p.dni_ce} (${p.nombres} ${p.apellidos}):`);
      console.log(`   Diplomados (${newDips.length}): ${newDips.map(d => d.titulo).join(', ')}`);
      console.log(`   Cursos (${newCursos.length}): ${newCursos.map(c => `[${c.codigo}] ${c.titulo}`).join(' | ')}`);
    }
  }

  console.log(`\n=== PROCESO COMPLETADO: ${actualizados} / ${profiles.length} perfiles actualizados exitosamente ===`);
}

applyOfficialStudentData().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
