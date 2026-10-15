import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function main() {
  console.log('--- POBLANDO PUBLIC.DIPLOMADOS_LECCIONES EN SUPABASE ---');

  // Cargar datos
  const diplomadosPath = path.join(__dirname, '..', 'lib', 'data', 'diplomados_todos.json');
  const driveVideosPath = path.join(__dirname, '..', 'lib', 'data', 'drive_videos_mapped.json');

  const rawDips = JSON.parse(fs.readFileSync(diplomadosPath, 'utf8'));
  const rawDrive = JSON.parse(fs.readFileSync(driveVideosPath, 'utf8'));

  const diplomados = rawDips.diplomados || [];
  console.log(`Cargando ${diplomados.length} diplomados...`);

  const rows = [];
  let ordenGlobal = 1;

  diplomados.forEach((dip, dIdx) => {
    const numStr = String(dIdx + 1).padStart(2, '0');
    const codigoDip = `DIP-${numStr}`;
    const tituloDip = (dip.diplomado || '').trim().toUpperCase();
    const modulos = Array.isArray(dip.modulos) ? dip.modulos : [];

    let totalClasesDip = 0;

    modulos.forEach((mod, mIdx) => {
      const codigoMod = `Módulo ${String(mIdx + 1).padStart(2, '0')}`;
      let nombreMod = (mod.nombre || '').trim();
      let docenteMod = (mod.docente || '').trim();

      if (!nombreMod && docenteMod.includes('MÓDULO')) {
        const parts = docenteMod.split(/MÓDULO \d+\s*-\s*/i);
        if (parts.length > 1) {
          docenteMod = parts[0].replace(/Docentes:\s*/i, '').trim();
          nombreMod = parts[1].trim();
        }
      }

      const rawTemas = Array.isArray(mod.temas) && mod.temas.length > 0
        ? mod.temas
        : (Array.isArray(mod.clases) && mod.clases.length > 0
            ? [{ titulo: `Tema 01: ${nombreMod || 'Fundamentos'}`, clases: mod.clases }]
            : [{ titulo: 'Tema 01: Especialización', clases: ['Sesión Magistral', 'Casuística Práctica'] }]);

      rawTemas.forEach((temaObj, tIdx) => {
        const rawTemaTitulo = temaObj.titulo || `Tema ${String(tIdx + 1).padStart(2, '0')}`;
        const temaTitulo = rawTemaTitulo.replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '').trim();
        const temaFormateado = temaTitulo.startsWith('Tema') ? temaTitulo : `Tema ${String(tIdx + 1).padStart(2, '0')}: ${temaTitulo}`;
        const clases = Array.isArray(temaObj.clases) ? temaObj.clases : [];

        clases.forEach((claseItem, cIdx) => {
          const isObj = typeof claseItem === 'object' && claseItem !== null;
          const rawSesion = isObj ? (claseItem.titulo || '') : String(claseItem);
          const sesionLimpia = rawSesion.replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '').trim();
          const sesionTitulo = clases.length > 1 ? `Parte ${cIdx + 1}` : (sesionLimpia || 'Sesión Completa');

          // Buscar video en drive mapped
          let videoUrl = isObj ? (claseItem.videoUrl || claseItem.iframe_url) : null;
          if (!videoUrl) {
            const driveDip = rawDrive[codigoDip.toLowerCase()] || Object.values(rawDrive).find(v => v.diplomado && v.diplomado.toUpperCase() === tituloDip);
            if (driveDip && driveDip.modulos && driveDip.modulos[mIdx] && driveDip.modulos[mIdx].clases) {
              const driveClase = driveDip.modulos[mIdx].clases[totalClasesDip];
              if (driveClase && driveClase.videoUrl) {
                videoUrl = driveClase.videoUrl;
              }
            }
          }

          rows.push({
            CodigoDiplomado: codigoDip,
            Diplomado: tituloDip,
            Modulo: codigoMod,
            NombreModulo: nombreMod || `MÓDULO ${String(mIdx + 1).padStart(2, '0')}`,
            Docente: docenteMod,
            Tema: temaFormateado,
            Sesion: sesionTitulo,
            VideoUrl: videoUrl || null,
            PdfUrl: isObj ? (claseItem.pdfUrl || claseItem.pdf_url || null) : null,
            ResumenVideoUrl: null,
            ResumenAudioUrl: null,
            ResumenInteractivo: null,
            Material1: null,
            Material2: null,
            Material3: null,
            Material4: null,
            Material5: null,
            Material6: null,
            Material7: null,
            Material8: null,
            orden: ordenGlobal++
          });

          totalClasesDip++;
        });
      });

      // Clase adicional
      const clasesAdicionales = Array.isArray(mod.clasesAdicionales) && mod.clasesAdicionales.length > 0
        ? mod.clasesAdicionales
        : [{ titulo: 'Clase Adicional: Sesión Especial de Refuerzo y Casuística Práctica' }];

      clasesAdicionales.forEach((caItem) => {
        const isObj = typeof caItem === 'object' && caItem !== null;
        const caTitulo = isObj ? (caItem.titulo || 'Clase Adicional') : String(caItem);

        rows.push({
          CodigoDiplomado: codigoDip,
          Diplomado: tituloDip,
          Modulo: codigoMod,
          NombreModulo: nombreMod || `MÓDULO ${String(mIdx + 1).padStart(2, '0')}`,
          Docente: docenteMod,
          Tema: '⭐ CLASE ADICIONAL',
          Sesion: caTitulo,
          VideoUrl: isObj ? (caItem.videoUrl || null) : null,
          PdfUrl: isObj ? (caItem.pdfUrl || null) : null,
          ResumenVideoUrl: null,
          ResumenAudioUrl: null,
          ResumenInteractivo: null,
          Material1: null,
          Material2: null,
          Material3: null,
          Material4: null,
          Material5: null,
          Material6: null,
          Material7: null,
          Material8: null,
          orden: ordenGlobal++
        });

        totalClasesDip++;
      });
    });
  });

  console.log(`Generadas ${rows.length} filas para insertar en public.diplomados_lecciones.`);

  // Probar si la tabla existe en Supabase
  const testRes = await admin.from('diplomados_lecciones').select('id').limit(1);
  if (testRes.error) {
    console.error('⚠️ La tabla public.diplomados_lecciones aún no existe en Supabase o dio error:');
    console.error(testRes.error.message);
    console.log('\nPor favor ejecuta la migración en el editor SQL de Supabase:');
    console.log('Archivo: supabase/migrations/20261013000000_create_diplomados_lecciones_table.sql\n');
    return;
  }

  console.log('Tabla encontrada. Insertando filas por lotes de 100...');
  const batchSize = 100;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await admin.from('diplomados_lecciones').insert(batch);
    if (error) {
      console.error(`Error en lote ${i}:`, error.message);
      break;
    }
    console.log(`✅ Lote ${i + 1} a ${i + batch.length} insertado.`);
  }

  console.log('--- POBLACIÓN FINALIZADA ---');
}

main().catch(console.error);
