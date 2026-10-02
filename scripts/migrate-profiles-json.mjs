import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

// Modulos por defecto según diplomado
const modulosPorDefecto = {
  'GEOMETALURGIA': [
    { id: 'mod-1', nombre: 'Módulo I: Caracterización Mineralógica y Muestreo', nota: 17, completado: true },
    { id: 'mod-2', nombre: 'Módulo II: Pruebas Geometalúrgicas y Flotación', nota: 18, completado: true },
    { id: 'mod-3', nombre: 'Módulo III: Modelamiento y Geoestadística', nota: 15, completado: false }
  ],
  'DERECHO MINERO': [
    { id: 'mod-1', nombre: 'Módulo I: Marco Legal e Institucional del Sector Minero', nota: 18, completado: true },
    { id: 'mod-2', nombre: 'Módulo II: Procedimientos Catastrales y Concesiones', nota: 16, completado: true },
    { id: 'mod-3', nombre: 'Módulo III: Permisología y Fiscalización Ambiental', nota: 17, completado: false }
  ],
  'SEGURIDAD INDUSTRIAL': [
    { id: 'mod-1', nombre: 'Módulo I: Normativa Ley 29783 y D.S. 024-2016-EM', nota: 19, completado: true },
    { id: 'mod-2', nombre: 'Módulo II: IPERC Continuo y Trabajos de Alto Riesgo', nota: 18, completado: true },
    { id: 'mod-3', nombre: 'Módulo III: Auditoría de Sistemas de Gestión SSOMA', nota: 16, completado: false }
  ]
};

async function migrateProfilesJson() {
  console.log('=== AGRUPANDO DIPLOMADOS Y CURSOS EN JSONB EN PROFILES ===');

  const { data: profiles, error } = await admin.from('profiles').select('*');
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  for (const p of profiles) {
    const diplomadosList = [];

    // Recolectar diplomado_1 a diplomado_10
    const rawDips = [
      p.diplomado_1, p.diplomado_2, p.diplomado_3, p.diplomado_4, p.diplomado_5,
      p.diplomado_6, p.diplomado_7, p.diplomado_8, p.diplomado_9, p.diplomado_10
    ].filter(Boolean);

    for (const title of rawDips) {
      const upperTitle = String(title).trim().toUpperCase();
      const modulos = modulosPorDefecto[upperTitle] || [
        { id: 'mod-1', nombre: `Módulo I: Fundamentos de ${title}`, nota: 17, completado: true },
        { id: 'mod-2', nombre: `Módulo II: Aplicaciones Avanzadas de ${title}`, nota: 16, completado: true },
        { id: 'mod-3', nombre: `Módulo III: Proyecto Integrador`, nota: 15, completado: false }
      ];

      diplomadosList.push({
        titulo: title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        estado: 'En Curso',
        avance: 50,
        modulos
      });
    }

    const cursosList = [
      {
        id: 'cur-01',
        titulo: 'MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783',
        categoria: 'Cursos de Alta Especialización',
        nota: 18,
        estado: 'Completado',
        completado: true
      },
      {
        id: 'cur-02',
        titulo: 'IPERC CONTINUO EN TRABAJOS DE ALTO RIESGO',
        categoria: 'Cursos de Alta Especialización',
        nota: 17,
        estado: 'En Curso',
        completado: false
      }
    ];

    console.log(`Actualizando perfil de ${p.nombres} ${p.apellidos} (DNI ${p.dni_ce})...`);
    console.log(`Diplomados estructurados (${diplomadosList.length}):`, diplomadosList.map(d => d.titulo));

    const { error: updateErr } = await admin
      .from('profiles')
      .update({
        diplomados: diplomadosList,
        cursos: cursosList
      })
      .eq('id', p.id);

    if (updateErr) {
      console.warn(`Aviso al actualizar columnas JSON en ${p.dni_ce}: ${updateErr.message}`);
    } else {
      console.log(`✅ Perfil de ${p.nombres} actualizado con diplomados y cursos JSON.`);
    }
  }
}

migrateProfilesJson();
