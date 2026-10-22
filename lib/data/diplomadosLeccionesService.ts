import { createAdminClient } from '@/lib/supabase/admin';
import diplomadosTodosJson from './diplomados_todos.json';
import { getDriveVideoForClass } from './driveVideos';

export interface LeccionRow {
  id?: string;
  CodigoDiplomado: string;
  Diplomado: string;
  Modulo: string;
  NombreModulo: string;
  Docente: string;
  Tema: string;
  Sesion: string;
  VideoUrl?: string | null;
  PdfUrl?: string | null;
  ResumenVideoUrl?: string | null;
  ResumenAudioUrl?: string | null;
  ResumenInteractivo?: string | null;
  ResumenMapaMental?: string | null;
  ResumenTexto?: string | null;
  Material1?: string | null;
  Material2?: string | null;
  Material3?: string | null;
  Material4?: string | null;
  Material5?: string | null;
  Material6?: string | null;
  Material7?: string | null;
  Material8?: string | null;
  orden?: number;
}

// Verifica si una cadena es un UUID válido v4/v1
export function esUuidValido(id: any): boolean {
  return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id.trim());
}

// Normaliza cualquier objeto fila independientemente de mayúsculas/minúsculas de la base de datos
export function normalizeLeccionRow(r: any): LeccionRow {
  if (!r || typeof r !== 'object') {
    return {
      CodigoDiplomado: '',
      Diplomado: '',
      Modulo: '',
      NombreModulo: '',
      Docente: '',
      Tema: '',
      Sesion: ''
    };
  }

  const out: LeccionRow = {
    CodigoDiplomado: (r.CodigoDiplomado ?? r.codigoDiplomado ?? r.codigodiplomado ?? r.codigo_diplomado ?? '').trim(),
    Diplomado: (r.Diplomado ?? r.diplomado ?? '').trim(),
    Modulo: (r.Modulo ?? r.modulo ?? '').trim(),
    NombreModulo: (r.NombreModulo ?? r.nombreModulo ?? r.nombremodulo ?? r.nombre_modulo ?? '').trim(),
    Docente: (r.Docente ?? r.docente ?? '').trim(),
    Tema: (r.Tema ?? r.tema ?? '').trim(),
    Sesion: (r.Sesion ?? r.sesion ?? r.titulo ?? '').trim(),
    VideoUrl: (r.VideoUrl ?? r.videoUrl ?? r.videourl ?? r.video_url ?? r.iframe_url ?? '').trim() || null,
    PdfUrl: (r.PdfUrl ?? r.pdfUrl ?? r.pdfurl ?? r.pdf_url ?? '').trim() || null,
    ResumenVideoUrl: (r.ResumenVideoUrl ?? r.resumenVideoUrl ?? r.videoResumenUrl ?? r.resumenvideourl ?? r.resumen_video_url ?? '').trim() || null,
    ResumenAudioUrl: (r.ResumenAudioUrl ?? r.resumenAudioUrl ?? r.audioResumenUrl ?? r.resumenaudiourl ?? r.resumen_audio_url ?? '').trim() || null,
    ResumenInteractivo: (r.ResumenInteractivo ?? r.resumenInteractivo ?? r.resumeninteractivo ?? r.resumen_interactivo ?? '').trim() || null,
    ResumenMapaMental: (r.ResumenMapaMental ?? r.resumenMapaMental ?? r.resumenmapamental ?? r.resumen_mapa_mental ?? r.mapaMentalUrl ?? r.mapamental ?? '').trim() || null,
    ResumenTexto: (r.ResumenTexto ?? r.resumenTexto ?? r.resumentexto ?? r.resumen_texto ?? '').trim() || null,
    Material1: (r.Material1 ?? r.material1 ?? r.excelUrl ?? r.excel_url ?? '').trim() || null,
    Material2: (r.Material2 ?? r.material2 ?? '').trim() || null,
    Material3: (r.Material3 ?? r.material3 ?? '').trim() || null,
    Material4: (r.Material4 ?? r.material4 ?? '').trim() || null,
    Material5: (r.Material5 ?? r.material5 ?? '').trim() || null,
    Material6: (r.Material6 ?? r.material6 ?? '').trim() || null,
    Material7: (r.Material7 ?? r.material7 ?? '').trim() || null,
    Material8: (r.Material8 ?? r.material8 ?? '').trim() || null,
    orden: typeof r.orden === 'number' ? r.orden : 0
  };

  // SÓLO incluir id si es un UUID válido. Si es "", null o texto arbitrario, dejar que Supabase genere el UUID automáticamente.
  if (r.id && esUuidValido(r.id)) {
    out.id = r.id.trim();
  }

  return out;
}

// Genera todas las filas maestras iniciales a partir de diplomados_todos.json y driveVideos.ts
export function generarFilasMaestrasIniciales(): LeccionRow[] {
  const rows: LeccionRow[] = [];
  const diplomados = diplomadosTodosJson.diplomados || [];
  let ordenGlobal = 1;

  diplomados.forEach((dip: any, dIdx: number) => {
    const numStr = (dIdx + 1).toString().padStart(2, '0');
    const codigoDip = `DIP-${numStr}`;
    const tituloDip = (dip.diplomado || '').trim().toUpperCase();
    const modulos = Array.isArray(dip.modulos) ? dip.modulos : [];

    let temaGlobalCounter = 1;
    let claseGlobalCounter = 1;
    let totalClasesDip = 0;

    modulos.forEach((mod: any, mIdx: number) => {
      const codigoMod = `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`;
      let nombreMod = (mod.nombre || '').trim();
      let docenteMod = (mod.docente || '').trim();

      if (!nombreMod && docenteMod.includes('MÓDULO')) {
        const parts = docenteMod.split(/MÓDULO \d+\s*-\s*/i);
        if (parts.length > 1) {
          docenteMod = parts[0].replace(/Docentes:\s*/i, '').trim();
          nombreMod = parts[1].trim();
        }
      }

      // Estructura de temas del módulo
      const rawTemas = Array.isArray(mod.temas) && mod.temas.length > 0
        ? mod.temas
        : (Array.isArray(mod.clases) && mod.clases.length > 0
            ? [{ titulo: `Tema 01: ${nombreMod || 'Fundamentos Aplicados'}`, clases: mod.clases }]
            : [{ titulo: 'Tema 01: Especialización', clases: ['Sesión Magistral', 'Casuística Práctica'] }]);

      rawTemas.forEach((temaObj: any) => {
        let temaTitulo = (temaObj.titulo || '').trim();
        // Remove previous "Tema \d+:" to re-number continuously if needed
        const baseTema = temaTitulo.replace(/^Tema\s*\d+[:\-\s]*/i, '').trim();
        const temaPad = (temaGlobalCounter++).toString().padStart(2, '0');
        const temaFormateado = `Tema ${temaPad}: ${baseTema || 'Especialización'}`;
        const clases = Array.isArray(temaObj.clases) ? temaObj.clases : [];

        clases.forEach((claseItem: any, cIdx: number) => {
          const isObj = typeof claseItem === 'object' && claseItem !== null;
          const rawSesion = isObj ? (claseItem.titulo || '') : String(claseItem);
          const claseNum = claseGlobalCounter++;
          
          let sesionTitulo = rawSesion;
          if (!sesionTitulo || !/^Clase\s*\d+/i.test(sesionTitulo)) {
            const parteLabel = clases.length > 1 ? `Parte ${cIdx + 1}` : 'Parte 1';
            sesionTitulo = `Clase ${claseNum}: ${parteLabel}`;
          }

          const driveVideo = isObj && (claseItem.videoUrl || claseItem.iframe_url)
            ? (claseItem.videoUrl || claseItem.iframe_url)
            : getDriveVideoForClass(codigoDip.toLowerCase(), mIdx, totalClasesDip);

          rows.push({
            CodigoDiplomado: codigoDip,
            Diplomado: tituloDip,
            Modulo: codigoMod,
            NombreModulo: nombreMod || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`,
            Docente: docenteMod,
            Tema: temaFormateado,
            Sesion: sesionTitulo,
            VideoUrl: driveVideo || null,
            PdfUrl: isObj ? (claseItem.pdfUrl || claseItem.pdf_url || null) : null,
            ResumenVideoUrl: isObj ? (claseItem.resumenVideoUrl || claseItem.videoResumenUrl || null) : null,
            ResumenAudioUrl: isObj ? (claseItem.resumenAudioUrl || claseItem.audioResumenUrl || null) : null,
            ResumenInteractivo: isObj ? (claseItem.resumenInteractivo || claseItem.ResumenInteractivo || null) : null,
            ResumenMapaMental: isObj ? (claseItem.resumenMapaMental || claseItem.ResumenMapaMental || claseItem.mapaMentalUrl || null) : null,
            Material1: isObj ? (claseItem.material1 || null) : null,
            Material2: isObj ? (claseItem.material2 || null) : null,
            Material3: isObj ? (claseItem.material3 || null) : null,
            Material4: isObj ? (claseItem.material4 || null) : null,
            Material5: isObj ? (claseItem.material5 || null) : null,
            Material6: isObj ? (claseItem.material6 || null) : null,
            Material7: isObj ? (claseItem.material7 || null) : null,
            Material8: isObj ? (claseItem.material8 || null) : null,
            orden: ordenGlobal++
          });

          totalClasesDip++;
        });
      });

      // Clases adicionales del módulo: sólo si existen explícitamente en los datos
      const clasesAdicionales = Array.isArray(mod.clasesAdicionales) ? mod.clasesAdicionales : [];

      clasesAdicionales.forEach((caItem: any) => {
        const isObj = typeof caItem === 'object' && caItem !== null;
        const caTitulo = isObj ? (caItem.titulo || 'Clase Adicional') : String(caItem);
        const driveVideo = isObj && (caItem.videoUrl || caItem.iframe_url)
          ? (caItem.videoUrl || caItem.iframe_url)
          : getDriveVideoForClass(codigoDip.toLowerCase(), mIdx, totalClasesDip);

        rows.push({
          CodigoDiplomado: codigoDip,
          Diplomado: tituloDip,
          Modulo: codigoMod,
          NombreModulo: nombreMod || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`,
          Docente: docenteMod,
          Tema: '⭐ CLASE ADICIONAL',
          Sesion: caTitulo,
          VideoUrl: driveVideo || null,
          PdfUrl: isObj ? (caItem.pdfUrl || caItem.pdf_url || null) : null,
          ResumenVideoUrl: isObj ? (caItem.resumenVideoUrl || null) : null,
          ResumenAudioUrl: isObj ? (caItem.resumenAudioUrl || null) : null,
          ResumenInteractivo: isObj ? (caItem.resumenInteractivo || null) : null,
          ResumenMapaMental: isObj ? (caItem.resumenMapaMental || caItem.mapaMentalUrl || null) : null,
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

  return rows;
}

// Construye la lista de recursos activos para una sesión: SÓLO incluye los campos que tienen links
export function obtenerRecursosConLinks(row: LeccionRow, numClase: number) {
  const recursos: any[] = [];
  const r = normalizeLeccionRow(row);

  // 1. Material de clases (PDF)
  if (r.PdfUrl) {
    recursos.push({
      id: `rec-pdf-${numClase}`,
      tipo: 'pdf',
      titulo: 'Material de clases',
      descripcion: 'Documento oficial con diapositivas y contenidos de la sesión · PDF',
      archivo: r.PdfUrl,
      url: r.PdfUrl
    });
  }

  // 2. Resumen en video
  if (r.ResumenVideoUrl) {
    recursos.push({
      id: `rec-video-resumen-${numClase}`,
      tipo: 'video',
      titulo: 'Resumen en video',
      descripcion: 'Video sumario con los puntos más relevantes de la sesión',
      archivo: r.ResumenVideoUrl,
      url: r.ResumenVideoUrl
    });
  }

  // 3. Resumen en audio
  if (r.ResumenAudioUrl) {
    recursos.push({
      id: `rec-audio-${numClase}`,
      tipo: 'audio',
      titulo: 'Resumen en audio',
      descripcion: 'Audio oficial o reproductor interactivo para estudio y repaso de la sesión',
      archivo: r.ResumenAudioUrl,
      url: r.ResumenAudioUrl
    });
  }

  // 4. Resumen interactivo
  if (r.ResumenInteractivo) {
    recursos.push({
      id: `rec-interactivo-${numClase}`,
      tipo: 'interactivo',
      titulo: 'Resumen interactivo',
      descripcion: 'Guía interactiva de conceptos clave y validación dinámica',
      archivo: r.ResumenInteractivo,
      url: r.ResumenInteractivo
    });
  }

  // 5. Mapa mental
  if (r.ResumenMapaMental) {
    recursos.push({
      id: `rec-mapamental-${numClase}`,
      tipo: 'mapamental',
      titulo: 'Mapa mental',
      descripcion: 'Esquema conceptual y mapa mental interactivo de la sesión',
      archivo: r.ResumenMapaMental,
      url: r.ResumenMapaMental
    });
  }

  // 6. Materiales Adicionales (Material1 hasta Material8): sólo si tienen link
  const materialesKeys: (keyof LeccionRow)[] = [
    'Material1', 'Material2', 'Material3', 'Material4',
    'Material5', 'Material6', 'Material7', 'Material8'
  ];

  materialesKeys.forEach((k, idx) => {
    const val = r[k];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      const numMat = idx + 1;
      const esExcel = val.toLowerCase().includes('.xlsx') || val.toLowerCase().includes('.xls') || val.toLowerCase().includes('sheet');
      const esPdf = val.toLowerCase().includes('.pdf');

      recursos.push({
        id: `rec-mat-${numClase}-${numMat}`,
        tipo: esExcel ? 'excel' : (esPdf ? 'pdf' : 'material'),
        titulo: `Material ${numMat}: ${esExcel ? 'Plantilla de Cálculo / Excel' : (esPdf ? 'Documento Complementario' : 'Recurso de Estudio')}`,
        descripcion: `Material didáctico adicional ${numMat} configurado para la sesión`,
        archivo: val.trim(),
        url: val.trim()
      });
    }
  });

  return recursos;
}

// Convierte las filas planas de la tabla diplomados_lecciones en la estructura de módulos que usa el LMS
export function convertirFilasAListaModulos(filas: LeccionRow[]) {
  const modulosMap = new Map<string, {
    codigo: string;
    nombre: string;
    docente: string;
    temasMap: Map<string, any[]>;
    clasesAdicionales: any[];
  }>();

  let globalClaseCounter = 1;

  filas.forEach((f) => {
    const r = normalizeLeccionRow(f);
    const modKey = r.Modulo || 'Módulo 01';

    if (!modulosMap.has(modKey)) {
      modulosMap.set(modKey, {
        codigo: modKey,
        nombre: r.NombreModulo || modKey,
        docente: r.Docente || '',
        temasMap: new Map(),
        clasesAdicionales: []
      });
    }

    const modObj = modulosMap.get(modKey)!;

    if (r.Tema.includes('CLASE ADICIONAL') || r.Tema.includes('ADICIONAL')) {
      modObj.clasesAdicionales.push({
        id: r.id,
        titulo: r.Sesion,
        videoUrl: r.VideoUrl,
        pdfUrl: r.PdfUrl,
        resumenVideoUrl: r.ResumenVideoUrl,
        resumenAudioUrl: r.ResumenAudioUrl,
        resumenInteractivo: r.ResumenInteractivo,
        resumenMapaMental: r.ResumenMapaMental,
        resumenTexto: r.ResumenTexto,
        material1: r.Material1,
        material2: r.Material2,
        material3: r.Material3,
        material4: r.Material4,
        material5: r.Material5,
        material6: r.Material6,
        material7: r.Material7,
        material8: r.Material8
      });
    } else {
      if (!modObj.temasMap.has(r.Tema)) {
        modObj.temasMap.set(r.Tema, []);
      }
      modObj.temasMap.get(r.Tema)!.push({
        id: r.id,
        titulo: r.Sesion,
        videoUrl: r.VideoUrl,
        pdfUrl: r.PdfUrl,
        resumenVideoUrl: r.ResumenVideoUrl,
        resumenAudioUrl: r.ResumenAudioUrl,
        resumenInteractivo: r.ResumenInteractivo,
        resumenMapaMental: r.ResumenMapaMental,
        resumenTexto: r.ResumenTexto,
        material1: r.Material1,
        material2: r.Material2,
        material3: r.Material3,
        material4: r.Material4,
        material5: r.Material5,
        material6: r.Material6,
        material7: r.Material7,
        material8: r.Material8
      });
    }
  });

  return Array.from(modulosMap.values()).map((m, mIdx) => {
    const temas = Array.from(m.temasMap.entries()).map(([temaTitulo, clasesList]) => ({
      titulo: temaTitulo,
      clases: clasesList
    }));

    return {
      codigo: m.codigo,
      nombre: m.nombre,
      docente: m.docente,
      temas,
      clasesAdicionales: m.clasesAdicionales,
      clases: temas.flatMap(t => t.clases)
    };
  });
}

// Convierte la estructura de módulos de un diplomado en filas planas para diplomados_lecciones
export function convertirModulosALeccionRows(codigoDiplomado: string, tituloDiplomado: string, modulos: any[]): LeccionRow[] {
  const rows: LeccionRow[] = [];
  if (!Array.isArray(modulos)) return rows;
  let orden = 1;

  modulos.forEach((mod: any, mIdx: number) => {
    const codigoMod = mod.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`;
    const nombreMod = mod.nombre || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`;
    const docenteMod = mod.docente || '';
    const temas = Array.isArray(mod.temas) && mod.temas.length > 0
      ? mod.temas
      : [{ titulo: `Tema 01: General`, clases: mod.clases || [] }];

    temas.forEach((temaObj: any, tIdx: number) => {
      const tituloTema = temaObj.titulo || `Tema ${(tIdx + 1).toString().padStart(2, '0')}`;
      const clases = Array.isArray(temaObj.clases) ? temaObj.clases : [];

      clases.forEach((claseObj: any) => {
        const isObj = typeof claseObj === 'object' && claseObj !== null;
        const sesion = isObj ? (claseObj.titulo || 'Clase') : String(claseObj);
        const videoUrl = isObj ? (claseObj.videoUrl || claseObj.iframe_url || '') : '';
        const pdfUrl = isObj ? (claseObj.pdfUrl || claseObj.pdf_url || '') : '';
        const resumenVideoUrl = isObj ? (claseObj.resumenVideoUrl || claseObj.videoResumenUrl || claseObj.ResumenVideoUrl || '') : '';
        const resumenAudioUrl = isObj ? (claseObj.resumenAudioUrl || claseObj.audioResumenUrl || claseObj.ResumenAudioUrl || '') : '';
        const resumenInteractivo = isObj ? (claseObj.resumenInteractivo || claseObj.ResumenInteractivo || '') : '';
        const resumenMapaMental = isObj ? (claseObj.resumenMapaMental || claseObj.ResumenMapaMental || claseObj.mapaMentalUrl || '') : '';
        const material1 = isObj ? (claseObj.material1 || claseObj.Material1 || claseObj.excel_url || claseObj.excelUrl || '') : '';
        const material2 = isObj ? (claseObj.material2 || claseObj.Material2 || '') : '';
        const material3 = isObj ? (claseObj.material3 || claseObj.Material3 || '') : '';
        const material4 = isObj ? (claseObj.material4 || claseObj.Material4 || '') : '';
        const material5 = isObj ? (claseObj.material5 || claseObj.Material5 || '') : '';
        const material6 = isObj ? (claseObj.material6 || claseObj.Material6 || '') : '';
        const material7 = isObj ? (claseObj.material7 || claseObj.Material7 || '') : '';
        const material8 = isObj ? (claseObj.material8 || claseObj.Material8 || '') : '';

        rows.push({
          CodigoDiplomado: codigoDiplomado,
          Diplomado: tituloDiplomado,
          Modulo: codigoMod,
          NombreModulo: nombreMod,
          Docente: docenteMod,
          Tema: tituloTema,
          Sesion: sesion,
          VideoUrl: videoUrl || null,
          PdfUrl: pdfUrl || null,
          ResumenVideoUrl: resumenVideoUrl || null,
          ResumenAudioUrl: resumenAudioUrl || null,
          ResumenInteractivo: resumenInteractivo || null,
          ResumenMapaMental: resumenMapaMental || null,
          Material1: material1 || null,
          Material2: material2 || null,
          Material3: material3 || null,
          Material4: material4 || null,
          Material5: material5 || null,
          Material6: material6 || null,
          Material7: material7 || null,
          Material8: material8 || null,
          orden: orden++
        });
      });
    });

    if (Array.isArray(mod.clasesAdicionales)) {
      mod.clasesAdicionales.forEach((ca: any) => {
        const isObj = typeof ca === 'object' && ca !== null;
        const sesion = isObj ? (ca.titulo || 'Clase Adicional') : String(ca);
        const videoUrl = isObj ? (ca.videoUrl || ca.iframe_url || '') : '';
        const pdfUrl = isObj ? (ca.pdfUrl || ca.pdf_url || '') : '';
        const resumenVideoUrl = isObj ? (ca.resumenVideoUrl || ca.videoResumenUrl || ca.ResumenVideoUrl || '') : '';
        const resumenAudioUrl = isObj ? (ca.resumenAudioUrl || ca.audioResumenUrl || ca.ResumenAudioUrl || '') : '';
        const resumenInteractivo = isObj ? (ca.resumenInteractivo || ca.ResumenInteractivo || '') : '';
        const resumenMapaMental = isObj ? (ca.resumenMapaMental || ca.ResumenMapaMental || ca.mapaMentalUrl || '') : '';
        const material1 = isObj ? (ca.material1 || ca.Material1 || ca.excel_url || ca.excelUrl || '') : '';
        const material2 = isObj ? (ca.material2 || ca.Material2 || '') : '';
        const material3 = isObj ? (ca.material3 || ca.Material3 || '') : '';
        const material4 = isObj ? (ca.material4 || ca.Material4 || '') : '';
        const material5 = isObj ? (ca.material5 || ca.Material5 || '') : '';
        const material6 = isObj ? (ca.material6 || ca.Material6 || '') : '';
        const material7 = isObj ? (ca.material7 || ca.Material7 || '') : '';
        const material8 = isObj ? (ca.material8 || ca.Material8 || '') : '';

        rows.push({
          CodigoDiplomado: codigoDiplomado,
          Diplomado: tituloDiplomado,
          Modulo: codigoMod,
          NombreModulo: nombreMod,
          Docente: docenteMod,
          Tema: '⭐ CLASE ADICIONAL',
          Sesion: sesion,
          VideoUrl: videoUrl || null,
          PdfUrl: pdfUrl || null,
          ResumenVideoUrl: resumenVideoUrl || null,
          ResumenAudioUrl: resumenAudioUrl || null,
          ResumenInteractivo: resumenInteractivo || null,
          ResumenMapaMental: resumenMapaMental || null,
          Material1: material1 || null,
          Material2: material2 || null,
          Material3: material3 || null,
          Material4: material4 || null,
          Material5: material5 || null,
          Material6: material6 || null,
          Material7: material7 || null,
          Material8: material8 || null,
          orden: orden++
        });
      });
    }
  });

  return rows;
}

