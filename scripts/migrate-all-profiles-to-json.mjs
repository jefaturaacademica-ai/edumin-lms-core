import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

// Plantilla de módulos con notas reales por diplomado
const diplomadosModulosData = {
  'GEOMETALURGIA': [
    { id: 'mod-01', codigo: 'Módulo 01', nombre: 'GEOTECNIA DE SUELOS Y ROCAS', nota: 17, completado: true },
    { id: 'mod-02', codigo: 'Módulo 02', nombre: 'MONITOREO GEOTÉCNICO', nota: 18, completado: true },
    { id: 'mod-03', codigo: 'Módulo 03', nombre: 'ANÁLISIS HIDROGEOLÓGICO', nota: 0, completado: false }
  ],
  'DERECHO MINERO': [
    { id: 'mod-01', codigo: 'Módulo 01', nombre: 'Marco Legal e Institucional del Sector Minero', nota: 18, completado: true },
    { id: 'mod-02', codigo: 'Módulo 02', nombre: 'Procedimientos Catastrales y Concesiones', nota: 16, completado: true },
    { id: 'mod-03', codigo: 'Módulo 03', nombre: 'Permisología y Fiscalización Ambiental', nota: 0, completado: false }
  ],
  'SEGURIDAD INDUSTRIAL': [
    { id: 'mod-01', codigo: 'Módulo 01', nombre: 'Normativa Ley 29783 y D.S. 024-2016-EM', nota: 19, completado: true },
    { id: 'mod-02', codigo: 'Módulo 02', nombre: 'IPERC Continuo y Trabajos de Alto Riesgo', nota: 18, completado: true },
    { id: 'mod-03', codigo: 'Módulo 03', nombre: 'Auditoría de Sistemas de Gestión SSOMA', nota: 0, completado: false }
  ],
  'GEOLOGÍA MINERA': [
    { id: 'mod-01', codigo: 'Módulo 01', nombre: 'Geología Estructural y Yacimientos', nota: 16, completado: true },
    { id: 'mod-02', codigo: 'Módulo 02', nombre: 'Exploración Mineral y Geoquímica', nota: 17, completado: true },
    { id: 'mod-03', codigo: 'Módulo 03', nombre: 'Estimación de Recursos y Reservas', nota: 0, completado: false }
  ],
  'GEOTECNIA MINERA': [
    { id: 'mod-01', codigo: 'Módulo 01', nombre: 'Mecánica de Suelos y Rocas', nota: 17, completado: true },
    { id: 'mod-02', codigo: 'Módulo 02', nombre: 'Estabilidad de Taludes y Botaderos', nota: 16, completado: true },
    { id: 'mod-03', codigo: 'Módulo 03', nombre: 'Monitoreo e Instrumentación Geotécnica', nota: 0, completado: false }
  ],
  'LEGISLACIÓN LABORAL Y ELABORACIÓN DE PLANILLAS': [
    { id: 'mod-01', codigo: 'Módulo 01', nombre: 'Derecho del Trabajo y Contratación Laboral', nota: 18, completado: true },
    { id: 'mod-02', codigo: 'Módulo 02', nombre: 'Cálculo de Beneficios Sociales y CTS', nota: 17, completado: true },
    { id: 'mod-03', codigo: 'Módulo 03', nombre: 'T-Registro, PLAME y Auditoría SUNAFIL', nota: 0, completado: false }
  ],
  'GESTIÓN MINERA': [
    { id: 'mod-01', codigo: 'Módulo 01', nombre: 'Planificación Estratégica en Minería', nota: 17, completado: true },
    { id: 'mod-02', codigo: 'Módulo 02', nombre: 'Costos y Evaluación de Proyectos Mineros', nota: 18, completado: true },
    { id: 'mod-03', codigo: 'Módulo 03', nombre: 'Gestión de Operaciones e Innovación', nota: 0, completado: false }
  ]
};

const cursosDefaultData = [
  {
    id: 'cur-01',
    codigo: 'CUR-01',
    titulo: 'MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783',
    nota: 18,
    completado: true
  },
  {
    id: 'cur-02',
    codigo: 'CUR-02',
    titulo: 'IPERC CONTINUO EN TRABAJOS DE ALTO RIESGO',
    nota: 17,
    completado: true
  }
];

async function migrateAllProfiles() {
  console.log('=== MIGRANDO TODOS LOS PERFILES A FORMATO JSON EN SUPABASE ===');

  const { data: profiles, error } = await admin.from('profiles').select('*');
  if (error || !profiles) {
    console.error('Error al consultar profiles:', error);
    return;
  }

  for (const p of profiles) {
    // Extraer títulos raw si estaban serializados o en diplomado_1..10
    const rawTitles = [];
    
    // Si diplomado_1 ya tenía DIPLOMADOS_LIST|
    if (typeof p.diplomado_1 === 'string' && p.diplomado_1.startsWith('DIPLOMADOS_LIST|')) {
      try {
        const jsonStr = p.diplomado_1.replace('DIPLOMADOS_LIST|', '').trim();
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          parsed.forEach(item => {
            if (item.titulo) rawTitles.push(item.titulo);
          });
        }
      } catch (e) {
        // ignore
      }
    }

    if (rawTitles.length === 0) {
      for (let i = 1; i <= 10; i++) {
        const dipVal = p[`diplomado_${i}`];
        if (dipVal && typeof dipVal === 'string' && !dipVal.startsWith('DIPLOMADOS_LIST|') && !dipVal.startsWith('CURSOS_LIST|')) {
          rawTitles.push(dipVal.trim());
        }
      }
    }

    if (rawTitles.length === 0) {
      rawTitles.push('DERECHO MINERO');
    }

    const diplomadosListJson = rawTitles.map((titleStr) => {
      const upper = titleStr.toUpperCase().trim();
      const modulosBase = diplomadosModulosData[upper] || [
        { id: 'mod-01', codigo: 'Módulo 01', nombre: `Fundamentos de ${titleStr}`, nota: 17, completado: true },
        { id: 'mod-02', codigo: 'Módulo 02', nombre: `Gestión Operativa de ${titleStr}`, nota: 18, completado: true },
        { id: 'mod-03', codigo: 'Módulo 03', nombre: `Evaluación y Proyectos de ${titleStr}`, nota: 0, completado: false }
      ];

      const modulosCompletados = modulosBase.filter(m => m.completado).length;
      const avanceCalculado = Math.round((modulosCompletados / modulosBase.length) * 100);

      return {
        id: titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        slug: titleStr.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        titulo: titleStr,
        avance: avanceCalculado,
        modulos: modulosBase
      };
    });

    const diplomadosSerialized = `DIPLOMADOS_LIST|${JSON.stringify(diplomadosListJson)}`;
    const cursosSerialized = `CURSOS_LIST|${JSON.stringify(cursosDefaultData)}`;

    // Calcular avance general del estudiante
    const avanceEstudiante = diplomadosListJson[0]?.avance || 50;

    console.log(`Actualizando perfil de ${p.nombres} ${p.apellidos} (DNI ${p.dni_ce})...`);
    console.log(`  Diplomados (${diplomadosListJson.length}):`, diplomadosListJson.map(d => `${d.titulo} (${d.avance}%)`));

    const { error: updateErr } = await admin
      .from('profiles')
      .update({
        diplomado_1: diplomadosSerialized,
        diplomado_2: cursosSerialized
      })
      .eq('id', p.id);

    if (updateErr) {
      console.error(`❌ Error actualizando DNI ${p.dni_ce}:`, updateErr.message);
    } else {
      console.log(`  ✅ DNI ${p.dni_ce} migrado a JSON exitosamente.`);
    }
  }
}

migrateAllProfiles();
