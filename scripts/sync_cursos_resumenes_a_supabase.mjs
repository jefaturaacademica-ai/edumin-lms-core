import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Cargar variables de entorno de .env.local
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const DIR_RESUMENES = 'G:\\Mi unidad\\CLASES Y RESÚMENES DIPLOMADOS 2026\\RESÚMENES DE DIPLOMADOS\\CARPETA DE ADICIONALES\\TRANSCRIPCIONES VIDEOS CURSOS\\MARKDOWN RESUMEN Y EXÁMENES\\MARKDOWN RESUMEN';

// Mapeo de archivos markdown de cursos a sus códigos
const CURSOS_MAP = [
  {
    codigo: 'CUR-01',
    archivo: 'resumenes_de_clases_manejo_de_epps_segun_la_norma_tecnica_pe.md',
    tituloCurso: 'MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783'
  },
  {
    codigo: 'CUR-02',
    archivo: 'resumenes_de_clases_implementacion_de_medidas_de_control_en_.md',
    tituloCurso: 'IMPLEMENTACIÓN DE MEDIDAS DE CONTROL EN RIESGOS MINEROS'
  },
  {
    codigo: 'CUR-03',
    archivo: 'resumenes_de_clases_ergonomia_y_salud_ocupacional_en_el_sect.md',
    tituloCurso: 'ERGONOMÍA Y SALUD OCUPACIONAL EN EL SECTOR MINERO E INDUSTRIAL'
  },
  {
    codigo: 'CUR-04',
    archivo: 'resumenes_de_clases_marco_juridico_y_normativo_de_la_mineria.md',
    tituloCurso: 'MARCO JURÍDICO Y NORMATIVO DE LA MINERÍA'
  },
  {
    codigo: 'CUR-05',
    archivo: 'resumenes_de_clases_gestion_de_proveedores_en_mineria.md',
    tituloCurso: 'GESTIÓN DE PROVEEDORES EN MINERÍA'
  },
  {
    codigo: 'CUR-06',
    archivo: 'resumenes_de_clases_control_de_costos_en_almacenes_mineros.md',
    tituloCurso: 'CONTROL DE COSTOS EN ALMACENES MINEROS'
  },
  {
    codigo: 'CUR-07',
    archivo: 'resumenes_de_clases_logistica_y_distribucion_en_la_industria.md',
    tituloCurso: 'LOGÍSTICA Y DISTRIBUCIÓN EN LA INDUSTRIA Y MINERÍA'
  },
  {
    codigo: 'CUR-08',
    archivo: 'resumenes_de_clases_contratos_en_la_industria_minera.md',
    tituloCurso: 'CONTRATOS EN LA INDUSTRIA MINERA'
  },
  {
    codigo: 'CUR-09',
    archivo: 'resumenes_de_clases_derechos_humanos_en_mineria.md',
    tituloCurso: 'DERECHOS HUMANOS EN MINERÍA'
  },
  {
    codigo: 'CUR-10',
    archivo: 'resumenes_de_clases_gestion_de_trabajo_en_alto_riesgo_en_min.md',
    tituloCurso: 'GESTIÓN DE TRABAJO EN ALTO RIESGO EN MINERÍA'
  },
  {
    codigo: 'CUR-11',
    archivo: 'resumenes_de_clases_responsabilidad_penal_en_mineria.md',
    tituloCurso: 'RESPONSABILIDAD PENAL EN MINERÍA'
  },
  {
    codigo: 'CUR-12',
    archivo: 'resumenes_de_clases_derecho_laboral_en_mineria.md',
    tituloCurso: 'DERECHO LABORAL EN MINERÍA'
  },
  {
    codigo: 'CUR-13',
    archivo: 'resumenes_de_clases_tipos_de_concesiones_mineras.md',
    tituloCurso: 'TIPOS DE CONCESIONES MINERAS'
  },
  {
    codigo: 'CUR-14',
    archivo: 'resumenes_de_clases_gestion_de_contratos_logisticos_en_la_in.md',
    tituloCurso: 'GESTIÓN DE CONTRATOS LOGÍSTICOS EN LA INDUSTRIA Y MINERÍA'
  },
  {
    codigo: 'CUR-15',
    archivo: 'resumenes_de_clases_curso_de_prevencion_de_riesgos.md',
    tituloCurso: 'CURSO DE PREVENCIÓN DE RIESGOS'
  },
  {
    codigo: 'CUR-16',
    archivo: 'resumenes_de_clases_implementacion_de_la_iso_45001_2018.md',
    tituloCurso: 'IMPLEMENTACIÓN DE LA ISO 45001:2018'
  },
  {
    codigo: 'CUR-17',
    archivo: 'resumenes_de_clases_gestion_de_emergencias_en_industria_y_mi.md',
    tituloCurso: 'GESTIÓN DE EMERGENCIAS EN INDUSTRIA Y MINERÍA'
  },
  {
    codigo: 'CUR-18',
    archivo: 'resumenes_de_clases_gestion_de_inventarios_en_industria_y_mi.md',
    tituloCurso: 'GESTIÓN DE INVENTARIOS EN INDUSTRIA Y MINERÍA'
  },
  {
    codigo: 'CUR-19',
    archivo: 'resumenes_de_clases_control_financiero_en_almacenes.md',
    tituloCurso: 'CONTROL FINANCIERO EN ALMACENES'
  },
  {
    codigo: 'CUR-20',
    archivo: 'resumenes_de_clases_logistica_interna_en_control_de_almacene.md',
    tituloCurso: 'LOGÍSTICA INTERNA EN CONTROL DE ALMACENES'
  },
  {
    codigo: 'CUR-21',
    archivo: 'resumenes_de_clases_fundamentos_de_big_data.md',
    tituloCurso: 'FUNDAMENTOS DE BIG DATA'
  },
  {
    codigo: 'CUR-22',
    archivo: 'resumenes_de_clases_metodos_de_captura_de_informacion_en_big.md',
    tituloCurso: 'MÉTODOS DE CAPTURA DE INFORMACIÓN EN BIG DATA'
  },
  {
    codigo: 'CUR-23',
    archivo: 'resumenes_de_clases_tendencias_2025_2026_claves_de_big_data.md',
    tituloCurso: 'TENDENCIAS 2025-2026: CLAVES DE BIG DATA'
  },
  {
    codigo: 'CUR-24',
    archivo: 'resumenes_de_clases_big_data_transformacion_de_datos_python_.md',
    tituloCurso: 'BIG DATA: TRANSFORMACIÓN DE DATOS (PYTHON Y R)'
  },
  {
    codigo: 'CUR-25',
    archivo: 'resumenes_de_clases_mineria_4_0_essentials_nuevas_herramient.md',
    tituloCurso: 'MINERÍA 4.0 ESSENTIALS: NUEVAS HERRAMIENTAS'
  },
  {
    codigo: 'CUR-26',
    archivo: 'resumenes_de_clases_innovacion_en_mineria_aplicaciones_de_in.md',
    tituloCurso: 'INNOVACIÓN EN MINERÍA: APLICACIONES DE INTELIGENCIA ARTIFICIAL'
  },
  {
    codigo: 'CUR-27',
    archivo: 'resumenes_de_clases_automatizacion_4_0_en_procesos_mineros.md',
    tituloCurso: 'AUTOMATIZACIÓN 4.0 EN PROCESOS MINEROS'
  },
  {
    codigo: 'CUR-28',
    archivo: 'resumenes_de_clases_cadena_de_suministro_logistica_y_distrib.md',
    tituloCurso: 'CADENA DE SUMINISTRO LOGÍSTICA Y DISTRIBUCIÓN'
  },
  {
    codigo: 'CUR-29',
    archivo: 'resumenes_de_clases_mejora_de_los_metodos_y_medicion_de_los_.md',
    tituloCurso: 'MEJORA DE LOS MÉTODOS Y MEDICIÓN DE LOS RECURSOS'
  },
  {
    codigo: 'CUR-30',
    archivo: 'resumenes_de_clases_introduccion_a_la_gestion_de_proyectos.md',
    tituloCurso: 'INTRODUCCIÓN A LA GESTIÓN DE PROYECTOS'
  },
  {
    codigo: 'CUR-31',
    archivo: 'resumenes_de_clases_arquitectura_de_datos_y_modelos_cloud.md',
    tituloCurso: 'ARQUITECTURA DE DATOS: LA IMPORTANCIA DEL DISEÑO EN EL RENDIMIENTO Y ESCALABILIDAD'
  },
  {
    codigo: 'CUR-32',
    archivo: 'resumenes_de_clases_ecosistema_big_data_herramientas_y_tecno.md',
    tituloCurso: 'ECOSISTEMA BIG DATA: HERRAMIENTAS Y TECNOLOGÍAS'
  },
  {
    codigo: 'CUR-33',
    archivo: 'resumenes_de_clases_introduccion_a_machine_learning_para_big.md',
    tituloCurso: 'INTRODUCCIÓN A MACHINE LEARNING PARA BIG DATA'
  },
  {
    codigo: 'CUR-34',
    archivo: 'resumenes_de_clases_proyectos_con_herramientas_digitales_par.md',
    tituloCurso: 'PROYECTOS CON HERRAMIENTAS DIGITALES PARA LA GESTIÓN DE OPERACIONES'
  },
  {
    codigo: 'CUR-35',
    archivo: 'resumenes_de_clases_introduccion_a_machine_learning_en_miner.md',
    tituloCurso: 'INTRODUCCIÓN A MACHINE LEARNING EN MINERÍA'
  },
  {
    codigo: 'CUR-36',
    archivo: 'resumenes_de_clases_tipos_de_inteligencia_artificial_aplicad.md',
    tituloCurso: 'TIPOS DE INTELIGENCIA ARTIFICIAL APLICADA A MINERÍA'
  },
  {
    codigo: 'CUR-37',
    archivo: 'resumenes_de_clases_herramientas_de_big_data_aplicada_a_mine.md',
    tituloCurso: 'HERRAMIENTAS DE BIG DATA APLICADA A MINERÍA'
  },
  {
    codigo: 'CUR-38',
    archivo: 'resumenes_de_clases_gestion_avanzada_de_operaciones_industri.md',
    tituloCurso: 'GESTIÓN AVANZADA DE OPERACIONES INDUSTRIALES'
  },
  {
    codigo: 'CUR-39',
    archivo: 'resumenes_de_clases_big_data_aplicada_a_procesos_industriale.md',
    tituloCurso: 'BIG DATA APLICADA A PROCESOS INDUSTRIALES'
  },
  {
    codigo: 'CUR-40',
    archivo: 'resumenes_de_clases_control_de_costos_en_produccion_industri.md',
    tituloCurso: 'CONTROL DE COSTOS EN PRODUCCIÓN INDUSTRIAL'
  },
  {
    codigo: 'CUR-41',
    archivo: 'resumenes_de_clases_importacion_y_exportacion_desde_0_claves.md',
    tituloCurso: 'IMPORTACIÓN Y EXPORTACIÓN DESDE 0: CLAVES PARA EL ÉXITO'
  },
  {
    codigo: 'CUR-42',
    archivo: 'resumenes_de_clases_implementacion_de_la_norma_iso_9001_2015.md',
    tituloCurso: 'IMPLEMENTACIÓN DE LA NORMA ISO 9001:2015'
  },
  {
    codigo: 'CUR-43',
    archivo: 'resumenes_de_clases_analisis_de_mercados_internacionales_est.md',
    tituloCurso: 'ANÁLISIS DE MERCADOS INTERNACIONALES: ESTRATEGIAS DE IMPORTACIÓN Y EXPORTACIÓN 2025-2026'
  },
  {
    codigo: 'CUR-44',
    archivo: 'resumenes_de_clases_de_la_importacion_a_la_venta_online_impl.md',
    tituloCurso: 'DE LA IMPORTACIÓN A LA VENTA ONLINE: IMPLEMENTA TU TIENDA VIRTUAL DESDE CERO'
  },
  {
    codigo: 'CUR-45',
    archivo: 'resumenes_de_clases_control_y_supervision_de_procesos_con_so.md',
    tituloCurso: 'CONTROL Y SUPERVISIÓN DE PROCESOS CON SOFTWARE SCADA'
  },
  {
    codigo: 'CUR-46',
    archivo: 'resumenes_de_clases_gestion_de_operaciones_y_procesos_en_la_.md',
    tituloCurso: 'GESTIÓN DE OPERACIONES Y PROCESOS EN LA MINERÍA'
  },
  {
    codigo: 'CUR-47',
    archivo: 'resumenes_de_clases_piramide_de_procesos_tecnicas_de_control.md',
    tituloCurso: 'PIRÁMIDE DE PROCESOS: TÉCNICAS DE CONTROL EN MINERÍA'
  },
  {
    codigo: 'CUR-48',
    archivo: 'resumenes_de_clases_proceso_de_optimizacion_del_mantenimient.md',
    tituloCurso: 'PROCESO DE OPTIMIZACIÓN DEL MANTENIMIENTO A PARTIR DEL USO DE TÉCNICAS DE LA INDUSTRIA 4.0'
  },
  {
    codigo: 'CUR-49',
    archivo: 'resumenes_de_clases_sistemas_integrados_para_la_gestion_de_m.md',
    tituloCurso: 'SISTEMAS INTEGRADOS PARA LA GESTIÓN DE MANTENIMIENTO'
  },
  {
    codigo: 'CUR-50',
    archivo: 'resumenes_de_clases_estandares_y_sistema_de_calidad_del_mant.md',
    tituloCurso: 'ESTÁNDARES Y SISTEMA DE CALIDAD DEL MANTENIMIENTO'
  },
  {
    codigo: 'CUR-51',
    archivo: 'resumenes_de_clases_documentacion_y_tramites_aduaneros.md',
    tituloCurso: 'DOCUMENTACIÓN Y TRÁMITES ADUANEROS'
  },
  {
    codigo: 'CUR-52',
    archivo: 'resumenes_de_clases_revision_de_proveedores_para_evitar_esta.md',
    tituloCurso: 'REVISIÓN DE PROVEEDORES PARA EVITAR ESTAFAS EN IMPORTACIONES CHINAS'
  },
  {
    codigo: 'CUR-53',
    archivo: 'resumenes_de_clases_planificacion_de_riesgos_para_importacio.md',
    tituloCurso: 'PLANIFICACIÓN DE RIESGOS PARA IMPORTACIÓN Y EXPORTACIÓN'
  },
  {
    codigo: 'CUR-54',
    archivo: 'resumenes_de_clases_control_de_calidad_en_procesos_mineros.md',
    tituloCurso: 'CONTROL DE CALIDAD EN PROCESOS MINEROS'
  },
  {
    codigo: 'CUR-55',
    archivo: 'resumenes_de_clases_monitoreo_y_control_en_la_operacion_de_p.md',
    tituloCurso: 'MONITOREO Y CONTROL EN LA OPERACIÓN DE PLANTAS MINERAS'
  },
  {
    codigo: 'CUR-56',
    archivo: 'resumenes_de_clases_sostenibilidad_y_seguridad_en_campamento.md',
    tituloCurso: 'SOSTENIBILIDAD Y SEGURIDAD EN CAMPAMENTOS MINEROS'
  },
  {
    codigo: 'CUR-57',
    archivo: 'resumenes_de_clases_analisis_de_datos_para_optimizar_operaci.md',
    tituloCurso: 'ANÁLISIS DE DATOS PARA OPTIMIZAR OPERACIONES MINERAS'
  },
  {
    codigo: 'CUR-58',
    archivo: 'resumenes_de_clases_seguridad_y_control_ambiental_en_el_mant.md',
    tituloCurso: 'SEGURIDAD Y CONTROL AMBIENTAL EN EL MANTENIMIENTO'
  },
  {
    codigo: 'CUR-59',
    archivo: 'resumenes_de_clases_gerencia_de_proyectos_del_mantenimiento.md',
    tituloCurso: 'GERENCIA DE PROYECTOS DEL MANTENIMIENTO'
  },
  {
    codigo: 'CUR-60',
    archivo: 'resumenes_de_clases_gestion_de_costos_del_mantenimiento_en_l.md',
    tituloCurso: 'GESTIÓN DE COSTOS DEL MANTENIMIENTO EN LA INDUSTRIA 4.0'
  },
  {
    codigo: 'CUR-61',
    archivo: 'resumenes_de_clases_sostenibilidad_y_mineria_responsable.md',
    tituloCurso: 'SOSTENIBILIDAD Y MINERÍA RESPONSABLE'
  },
  {
    codigo: 'CUR-62',
    archivo: 'resumenes_de_clases_primeros_auxilios_en_mineria.md',
    tituloCurso: 'PRIMEROS AUXILIOS EN MINERÍA'
  },
  {
    codigo: 'CUR-63',
    archivo: 'resumenes_de_clases_indicadores_clave_kpis_para_la_cadena_de.md',
    tituloCurso: 'INDICADORES CLAVE (KPIS) PARA LA CADENA DE ABASTECIMIENTOS'
  },
  {
    codigo: 'CUR-64',
    archivo: 'resumenes_de_clases_exploracion_minera_y_evaluacion_de_yacim.md',
    tituloCurso: 'EXPLORACIÓN MINERA Y EVALUACIÓN DE YACIMIENTOS'
  },
  {
    codigo: 'CUR-65',
    archivo: 'resumenes_de_clases_requisitos_clave_de_iso_14001_y_como_apl.md',
    tituloCurso: 'REQUISITOS CLAVE DE ISO 14001 Y CÓMO APLICARLOS EN LA EMPRESA'
  },
  {
    codigo: 'CUR-66',
    archivo: 'resumenes_de_clases_sistemas_integrados_de_gestion_hseq_iso_.md',
    tituloCurso: 'SISTEMAS INTEGRADOS DE GESTIÓN HSEQ (ISO 9001, 14001, 45001)'
  },
  {
    codigo: 'CUR-67',
    archivo: 'resumenes_de_clases_gestion_de_crisis_y_manejo_de_conflictos.md',
    tituloCurso: 'GESTIÓN DE CRISIS Y MANEJO DE CONFLICTOS EN AMBIENTES INDUSTRIALES'
  },
  {
    codigo: 'CUR-68',
    archivo: 'resumenes_de_clases_planificacion_estrategica_y_balanced_sco.md',
    tituloCurso: 'PLANIFICACIÓN ESTRATÉGICA Y BALANCED SCORECARD'
  },
  {
    codigo: 'CUR-69',
    archivo: 'resumenes_de_clases_gestion_de_la_energia_en_operaciones_min.md',
    tituloCurso: 'GESTIÓN DE LA ENERGÍA EN OPERACIONES MINERAS'
  },
  {
    codigo: 'CUR-70',
    archivo: 'resumenes_de_clases_gestion_de_la_cadena_de_suministro_en_em.md',
    tituloCurso: 'GESTIÓN DE LA CADENA DE SUMINISTRO EN EMPRESAS MINERAS'
  },
  {
    codigo: 'CUR-71',
    archivo: 'resumenes_de_clases_seguridad_y_normativa_en_el_control_de_i.md',
    tituloCurso: 'SEGURIDAD Y NORMATIVA EN EL CONTROL DE INVENTARIO Y LOGÍSTICA MINERA'
  },
  {
    codigo: 'CUR-72',
    archivo: 'resumenes_de_clases_salud_mental_en_el_trabajo_deteccion_y_p.md',
    tituloCurso: 'SALUD MENTAL EN EL TRABAJO: DETECCIÓN Y PREVENCIÓN DE TRASTORNOS PSICOLÓGICOS'
  },
  {
    codigo: 'CUR-73',
    archivo: 'resumenes_de_clases_implementacion_de_lean_manufacturing_en_.md',
    tituloCurso: 'IMPLEMENTACIÓN DE LEAN MANUFACTURING EN PROCESOS INDUSTRIALES'
  },
  {
    codigo: 'CUR-74',
    archivo: 'resumenes_de_clases_ergonomia_y_diseno_de_puestos_de_trabajo.md',
    tituloCurso: 'ERGONOMÍA Y DISEÑO DE PUESTOS DE TRABAJO EN LA INDUSTRIA'
  },
  {
    codigo: 'CUR-75',
    archivo: 'resumenes_de_clases_gestion_de_seguridad_durante_las_paradas.md',
    tituloCurso: 'GESTIÓN DE SEGURIDAD DURANTE LAS PARADAS DE PLANTA Y MANTENIMIENTO'
  },
  {
    codigo: 'CUR-76',
    archivo: 'resumenes_de_clases_gestion_de_relaves_y_residuos_mineros.md',
    tituloCurso: 'GESTIÓN DE RELAVES Y RESIDUOS MINEROS'
  },
  {
    codigo: 'TAL-01',
    archivo: 'resumenes_de_clases_taller_de_soft_skills_en_la_industria_y_.md',
    tituloCurso: 'TALLER DE SOFT SKILLS EN LA INDUSTRIA Y MINERÍA'
  },
  {
    codigo: 'TAL-02',
    archivo: 'resumenes_de_clases_taller_de_seguridad_basada_en_el_comport.md',
    tituloCurso: 'TALLER DE SEGURIDAD BASADA EN EL COMPORTAMIENTO'
  }
];

function buscarArchivo(nombre) {
  const rutaPrincipal = path.join(DIR_RESUMENES, nombre);
  if (fs.existsSync(rutaPrincipal)) return rutaPrincipal;

  const rutaProcesado = path.join(DIR_RESUMENES, 'procesado', nombre);
  if (fs.existsSync(rutaProcesado)) return rutaProcesado;

  return null;
}

function parsearMarkdownCurso(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sections = content.split(/###\s+FUENTE:\s*/i).slice(1);

  return sections.map((sec, idx) => {
    const lines = sec.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const fuente = lines[0];

    const matchTitulo = sec.match(/\*\*Título sugerido:\*\*\s*([\s\S]*?)(?=\*\*Resumen:\*\*|$)/i);
    const tituloSugerido = matchTitulo ? matchTitulo[1].trim() : '';

    const resumenMatch = sec.match(/\*\*Resumen:\*\*\s*([\s\S]*?)(?=\*\*(?:Puntos|Temas)\s+clave:\*\*|$)/i);
    const temasMatch = sec.match(/\*\*(?:Puntos|Temas)\s+clave:\*\*\s*([\s\S]*?)(?=---|###|$)/i);

    const parrafo = resumenMatch ? resumenMatch[1].trim() : '';
    const lineasTemas = temasMatch 
      ? temasMatch[1].trim().split(/\r?\n/).filter(l => l.trim().startsWith('-'))
      : [];

    const temasClave = lineasTemas.map(l => {
      const raw = l.trim().replace(/^-\s*/, '').trim();
      const matchTerm = raw.match(/^\*\*(.*?)(?::)?\*\*(?::)?\s*([\s\S]*)$/);
      if (matchTerm) {
        return {
          titulo: matchTerm[1].trim(),
          descripcion: matchTerm[2].trim(),
          texto: `- **${matchTerm[1].trim()}:** ${matchTerm[2].trim()}`
        };
      }
      return {
        titulo: '',
        descripcion: raw,
        texto: `- ${raw}`
      };
    });

    const markdownNormalizado = [
      '**Resumen:**',
      parrafo,
      '',
      '**Puntos clave:**',
      ...temasClave.map(t => t.texto)
    ].join('\n');

    return {
      indice: idx,
      fuente,
      tituloSugerido,
      parrafo,
      temasClave,
      markdown: markdownNormalizado
    };
  });
}

async function sincronizarCursos() {
  console.log('=== SINCRONIZANDO RESÚMENES Y TEMAS DE CURSOS A SUPABASE ===\n');

  // Cargar cache existente
  const cachePath = path.join(__dirname, '..', 'lib', 'data', 'resumenes_clases_cache.json');
  let cacheGlobal = {};
  if (fs.existsSync(cachePath)) {
    try {
      cacheGlobal = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    } catch (e) {
      console.warn('No se pudo leer cache anterior:', e.message);
    }
  }

  let totalActualizadas = 0;
  const titulosActualizadosPorCurso = {};

  const args = process.argv.slice(2);
  const cursosAProcesar = args.length > 0
    ? CURSOS_MAP.filter(c => args.includes(c.codigo))
    : CURSOS_MAP;

  console.log(`Cursos seleccionados para sincronizar: ${cursosAProcesar.map(c => c.codigo).join(', ')}`);

  for (const cConfig of cursosAProcesar) {
    const fullMDPath = buscarArchivo(cConfig.archivo);
    if (!fullMDPath) {
      console.error(`❌ No existe el archivo: ${cConfig.archivo} (ni en raíz ni en procesado)`);
      continue;
    }

    const sesionesMD = parsearMarkdownCurso(fullMDPath);
    console.log(`\n📘 Procesando ${cConfig.codigo} (${cConfig.tituloCurso})`);
    console.log(`   Archivo MD: ${path.basename(fullMDPath)} (${sesionesMD.length} sesiones detectadas)`);

    // Consultar lecciones en Supabase
    const { data: dbLessons, error: dbErr } = await sb
      .from('lecciones')
      .select('id, CodigoDiplomado, Modulo, Tema, Sesion, orden, ResumenTexto')
      .eq('CodigoDiplomado', cConfig.codigo)
      .order('orden', { ascending: true })
      .order('id', { ascending: true });

    if (dbErr) {
      console.error(`   ❌ Error consultando lecciones de ${cConfig.codigo}:`, dbErr.message);
      continue;
    }

    if (!dbLessons || dbLessons.length === 0) {
      console.warn(`   ⚠️ No se encontraron lecciones en la tabla 'lecciones' para ${cConfig.codigo}`);
      continue;
    }

    console.log(`   Filas en Supabase: ${dbLessons.length}`);
    titulosActualizadosPorCurso[cConfig.codigo] = [];

    for (let i = 0; i < dbLessons.length; i++) {
      const row = dbLessons[i];
      const mdItem = sesionesMD[i];

      if (!mdItem) {
        console.warn(`   ⚠️ No hay datos en MD para la fila ${i + 1} (${row.Tema})`);
        continue;
      }

      // Preservar numeración del tema (ej. "Tema 01:", "Tema 02:")
      const numMatch = (row.Tema || '').match(/^(Tema\s+\d+:)/i);
      const prefixTema = numMatch ? numMatch[1] : `Tema ${(i + 1).toString().padStart(2, '0')}:`;
      const nuevoTema = mdItem.tituloSugerido 
        ? `${prefixTema} ${mdItem.tituloSugerido}`
        : row.Tema;

      titulosActualizadosPorCurso[cConfig.codigo].push({
        numClase: `CLASE ${(i + 1).toString().padStart(2, '0')}`,
        tituloLimpio: mdItem.tituloSugerido,
        temaCompleto: nuevoTema
      });

      console.log(`   -> [Fila ${i + 1}] ID: ${row.id}`);
      console.log(`      Tema previo:  "${row.Tema}"`);
      console.log(`      Tema nuevo:   "${nuevoTema}"`);
      console.log(`      Título sug.:  "${mdItem.tituloSugerido}"`);
      console.log(`      Resumen length: ${mdItem.parrafo.length} chars | Puntos clave: ${mdItem.temasClave.length}`);

      // Actualizar en Supabase
      const { error: updErr } = await sb
        .from('lecciones')
        .update({
          Tema: nuevoTema,
          ResumenTexto: mdItem.markdown
        })
        .eq('id', row.id);

      if (updErr) {
        console.error(`      ❌ Error al actualizar en Supabase:`, updErr.message);
      } else {
        totalActualizadas++;
        console.log(`      ✅ Actualizado con éxito en Supabase.`);
      }

      // Guardar en cache global
      cacheGlobal[row.id] = {
        parrafo: mdItem.parrafo,
        temasClave: mdItem.temasClave,
        markdown: mdItem.markdown,
        fuente: mdItem.fuente,
        tituloSugerido: mdItem.tituloSugerido
      };
    }
  }

  // Guardar cache local
  fs.writeFileSync(cachePath, JSON.stringify(cacheGlobal, null, 2), 'utf8');
  console.log(`\n✅ Respaldo y caché actualizados en: lib/data/resumenes_clases_cache.json (${Object.keys(cacheGlobal).length} lecciones totales en caché).`);

  // Actualizar Excel cursos_clases.xlsx si existe
  const excelPath = path.join(__dirname, '..', 'cursos_clases.xlsx');
  if (fs.existsSync(excelPath)) {
    try {
      console.log('\n📊 Sincronizando títulos en cursos_clases.xlsx...');
      const wb = xlsx.readFile(excelPath);

      // 1. Hoja "Cursos y Clases"
      if (wb.Sheets['Cursos y Clases']) {
        const rowsCC = xlsx.utils.sheet_to_json(wb.Sheets['Cursos y Clases']);
        const newRowsCC = [];
        rowsCC.forEach(r => {
          const cod = r['Código'];
          const num = (r['N° Clase'] || '').toUpperCase();
          if (titulosActualizadosPorCurso[cod]) {
            if (cod.startsWith('TAL-') && (!num || num === '')) {
              // Si el taller tenia una fila vacía de clase, expandir a las clases reales
              const clasesTaller = titulosActualizadosPorCurso[cod];
              clasesTaller.forEach(c => {
                newRowsCC.push({
                  ...r,
                  'N° Clase': c.numClase,
                  'Nombre de la Clase': c.tituloLimpio
                });
              });
              return;
            } else {
              const matchTit = titulosActualizadosPorCurso[cod].find(t => t.numClase === num);
              if (matchTit && matchTit.tituloLimpio) {
                r['Nombre de la Clase'] = matchTit.tituloLimpio;
              }
            }
          }
          newRowsCC.push(r);
        });
        const newSheetCC = xlsx.utils.json_to_sheet(newRowsCC);
        wb.Sheets['Cursos y Clases'] = newSheetCC;
      }

      // 2. Hoja "Catálogo Completo (78)"
      if (wb.Sheets['Catálogo Completo (78)']) {
        const rowsCat = xlsx.utils.sheet_to_json(wb.Sheets['Catálogo Completo (78)']);
        rowsCat.forEach(r => {
          const cod = r['Código'];
          if (titulosActualizadosPorCurso[cod] && titulosActualizadosPorCurso[cod].length > 0) {
            const clasesStr = titulosActualizadosPorCurso[cod].map(t => t.tituloLimpio).join(' | ');
            r['Clases (Separadas por |)'] = clasesStr;
            if (cod.startsWith('TAL-')) {
              r['Total Clases'] = titulosActualizadosPorCurso[cod].length;
            }
          }
        });
        const newSheetCat = xlsx.utils.json_to_sheet(rowsCat);
        wb.Sheets['Catálogo Completo (78)'] = newSheetCat;
      }

      xlsx.writeFile(wb, excelPath);
      console.log('✅ Archivo cursos_clases.xlsx actualizado exitosamente con los nuevos títulos.');
    } catch (e) {
      console.warn('⚠️ No se pudo actualizar el Excel cursos_clases.xlsx:', e.message);
    }
  }

  console.log(`\n🎉 PROCESO FINALIZADO: ${totalActualizadas} lecciones de cursos procesadas/actualizadas en Supabase.`);
}

sincronizarCursos();
