import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function seedCertificaciones() {
  console.log('🚀 Poblando la tabla public.certificaciones en Supabase...');

  // 1. Obtener el perfil de Juan Carlos Quispe Ramos (DNI: 71234567)
  const { data: profile, error: pErr } = await admin
    .from('profiles')
    .select('*')
    .eq('dni_ce', '71234567')
    .maybeSingle();

  if (pErr || !profile) {
    console.error('Error buscando perfil 71234567:', pErr);
    return;
  }

  console.log(`👤 Alumno encontrado: ${profile.nombres} ${profile.apellidos} (ID: ${profile.id})`);

  const studentName = `${profile.nombres || ''} ${profile.apellidos || ''}`.trim() || 'Juan Carlos Quispe Ramos';
  const dni = profile.dni_ce || '71234567';

  // Limpiar certificados previos si existieran
  await admin.from('certificaciones').delete().eq('dni_ce', dni);

  // Lista oficial de certificados reales con códigos correlativos y plantillas snapshot
  const certificacionesSeed = [
    {
      codigo_verificacion: 'EDUMIN-DIP-2026-0001',
      profile_id: profile.id,
      dni_ce: dni,
      estudiante_nombre: studentName,
      tipo: 'DIPLOMA',
      programa_titulo: 'Diplomado de Alta Especialización en Geometalurgia Aplicada',
      modulo_titulo: null,
      horas_lectivas: '120 horas cronológicas',
      nota_final: 18.0,
      fecha_emision: '2026-03-15',
      estado_financiero_al_dia: true,
      plantilla_snapshot: {
        nombrePlantilla: 'Superplantilla maestra - Diplomas oficiales DAEM',
        estiloMarco: 'dorado',
        tituloHeader: 'DIPLOMA DE ALTA ESPECIALIZACIÓN',
        escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
        institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
        firmas: ['Director Académico', 'Coordinador General']
      }
    },
    {
      codigo_verificacion: 'EDUMIN-MOD-2026-0001',
      profile_id: profile.id,
      dni_ce: dni,
      estudiante_nombre: studentName,
      tipo: 'MODULAR',
      programa_titulo: 'Diplomado de Alta Especialización en Geometalurgia Aplicada',
      modulo_titulo: 'Módulo I: Fundamentos y Caracterización Minera',
      horas_lectivas: '40 horas cronológicas',
      nota_final: 18.0,
      fecha_emision: '2026-01-20',
      estado_financiero_al_dia: true,
      plantilla_snapshot: {
        nombrePlantilla: 'Superplantilla maestra - Certificados modulares',
        estiloMarco: 'azul',
        tituloHeader: 'CERTIFICADO MODULAR OFICIAL',
        escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
        institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
        firmas: ['Director Académico']
      }
    },
    {
      codigo_verificacion: 'EDUMIN-MOD-2026-0002',
      profile_id: profile.id,
      dni_ce: dni,
      estudiante_nombre: studentName,
      tipo: 'MODULAR',
      programa_titulo: 'Diplomado de Alta Especialización en Geometalurgia Aplicada',
      modulo_titulo: 'Módulo II: Pruebas Metalúrgicas a Escala de Laboratorio',
      horas_lectivas: '40 horas cronológicas',
      nota_final: 19.0,
      fecha_emision: '2026-02-10',
      estado_financiero_al_dia: true,
      plantilla_snapshot: {
        nombrePlantilla: 'Superplantilla maestra - Certificados modulares',
        estiloMarco: 'azul',
        tituloHeader: 'CERTIFICADO MODULAR OFICIAL',
        escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
        institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
        firmas: ['Director Académico']
      }
    },
    {
      codigo_verificacion: 'EDUMIN-MOD-2026-0003',
      profile_id: profile.id,
      dni_ce: dni,
      estudiante_nombre: studentName,
      tipo: 'MODULAR',
      programa_titulo: 'Diplomado de Alta Especialización en Geometalurgia Aplicada',
      modulo_titulo: 'Módulo III: Modelamiento Geometalúrgico en Leapfrog',
      horas_lectivas: '40 horas cronológicas',
      nota_final: 18.0,
      fecha_emision: '2026-03-01',
      estado_financiero_al_dia: true,
      plantilla_snapshot: {
        nombrePlantilla: 'Superplantilla maestra - Certificados modulares',
        estiloMarco: 'azul',
        tituloHeader: 'CERTIFICADO MODULAR OFICIAL',
        escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
        institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
        firmas: ['Director Académico']
      }
    },
    {
      codigo_verificacion: 'EDUMIN-MOD-2026-0004',
      profile_id: profile.id,
      dni_ce: dni,
      estudiante_nombre: studentName,
      tipo: 'MODULAR',
      programa_titulo: 'Diplomado de Alta Especialización en Geometalurgia Aplicada',
      modulo_titulo: 'Módulo IV: Conminución y Liberación Mineral',
      horas_lectivas: '40 horas cronológicas',
      nota_final: 17.0,
      fecha_emision: '2026-03-05',
      estado_financiero_al_dia: true,
      plantilla_snapshot: {
        nombrePlantilla: 'Superplantilla maestra - Certificados modulares',
        estiloMarco: 'azul',
        tituloHeader: 'CERTIFICADO MODULAR OFICIAL',
        escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
        institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
        firmas: ['Director Académico']
      }
    },
    {
      codigo_verificacion: 'EDUMIN-MOD-2026-0005',
      profile_id: profile.id,
      dni_ce: dni,
      estudiante_nombre: studentName,
      tipo: 'MODULAR',
      programa_titulo: 'Diplomado de Alta Especialización en Geometalurgia Aplicada',
      modulo_titulo: 'Módulo V: Flotación y Separación Sólido-Líquido',
      horas_lectivas: '40 horas cronológicas',
      nota_final: 18.0,
      fecha_emision: '2026-03-10',
      estado_financiero_al_dia: true,
      plantilla_snapshot: {
        nombrePlantilla: 'Superplantilla maestra - Certificados modulares',
        estiloMarco: 'azul',
        tituloHeader: 'CERTIFICADO MODULAR OFICIAL',
        escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
        institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
        firmas: ['Director Académico']
      }
    },
    {
      codigo_verificacion: 'EDUMIN-MOD-2026-0006',
      profile_id: profile.id,
      dni_ce: dni,
      estudiante_nombre: studentName,
      tipo: 'MODULAR',
      programa_titulo: 'Diplomado de Alta Especialización en Geometalurgia Aplicada',
      modulo_titulo: 'Módulo VI: Optimización del Proceso de Lixivación',
      horas_lectivas: '40 horas cronológicas',
      nota_final: 19.0,
      fecha_emision: '2026-03-12',
      estado_financiero_al_dia: true,
      plantilla_snapshot: {
        nombrePlantilla: 'Superplantilla maestra - Certificados modulares',
        estiloMarco: 'azul',
        tituloHeader: 'CERTIFICADO MODULAR OFICIAL',
        escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
        institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
        firmas: ['Director Académico']
      }
    },
    {
      codigo_verificacion: 'EDUMIN-MOD-2026-0007',
      profile_id: profile.id,
      dni_ce: dni,
      estudiante_nombre: studentName,
      tipo: 'MODULAR',
      programa_titulo: 'Diplomado de Alta Especialización en Geometalurgia Aplicada',
      modulo_titulo: 'Módulo VII: Proyecto Integrador Geometalúrgico',
      horas_lectivas: '40 horas cronológicas',
      nota_final: 18.0,
      fecha_emision: '2026-03-14',
      estado_financiero_al_dia: true,
      plantilla_snapshot: {
        nombrePlantilla: 'Superplantilla maestra - Certificados modulares',
        estiloMarco: 'azul',
        tituloHeader: 'CERTIFICADO MODULAR OFICIAL',
        escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
        institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
        firmas: ['Director Académico']
      }
    },
    {
      codigo_verificacion: 'EDUMIN-CUR-2026-0001',
      profile_id: profile.id,
      dni_ce: dni,
      estudiante_nombre: studentName,
      tipo: 'CURSO',
      programa_titulo: 'Curso Especializado en Ley de Seguridad y Salud en el Trabajo',
      modulo_titulo: null,
      horas_lectivas: '24 horas cronológicas',
      nota_final: 19.0,
      fecha_emision: '2026-02-18',
      estado_financiero_al_dia: true,
      plantilla_snapshot: {
        nombrePlantilla: 'Superplantilla maestra - Cursos de especialización',
        estiloMarco: 'esmeralda',
        tituloHeader: 'CERTIFICADO DE ESPECIALIZACIÓN PROFESIONAL',
        escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
        institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
        firmas: ['Director Académico', 'Docente Titular']
      }
    },
    {
      codigo_verificacion: 'EDUMIN-CUR-2026-0002',
      profile_id: profile.id,
      dni_ce: dni,
      estudiante_nombre: studentName,
      tipo: 'CURSO',
      programa_titulo: 'Curso de Identificación de Peligros, Evaluación de Riesgos (IPERC)',
      modulo_titulo: null,
      horas_lectivas: '24 horas cronológicas',
      nota_final: 18.0,
      fecha_emision: '2026-02-22',
      estado_financiero_al_dia: true,
      plantilla_snapshot: {
        nombrePlantilla: 'Superplantilla maestra - Cursos de especialización',
        estiloMarco: 'esmeralda',
        tituloHeader: 'CERTIFICADO DE ESPECIALIZACIÓN PROFESIONAL',
        escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
        institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
        firmas: ['Director Académico', 'Docente Titular']
      }
    },
    {
      codigo_verificacion: 'EDUMIN-TAL-2026-0001',
      profile_id: profile.id,
      dni_ce: dni,
      estudiante_nombre: studentName,
      tipo: 'TALLER',
      programa_titulo: 'Taller Práctico de Respuesta ante Emergencias Mineras',
      modulo_titulo: null,
      horas_lectivas: '08 horas prácticas',
      nota_final: 20.0,
      fecha_emision: '2026-03-02',
      estado_financiero_al_dia: true,
      plantilla_snapshot: {
        nombrePlantilla: 'Superplantilla maestra - Talleres y masterclasses',
        estiloMarco: 'tecnologico',
        tituloHeader: 'CONSTANCIA DE TALLER PRÁCTICO EN VIVO',
        escuelaHeader: 'ESCUELA DE POSTGRADO & MINERÍA',
        institucionHeader: 'INSTITUTO INTERNACIONAL EDUMIN',
        firmas: ['Director Académico']
      }
    }
  ];

  const { data: inserted, error: iErr } = await admin
    .from('certificaciones')
    .insert(certificacionesSeed)
    .select();

  if (iErr) {
    console.error('❌ Error al insertar certificaciones:', iErr);
    return;
  }

  console.log(`✅ ¡Se han insertado exitosamente ${inserted.length} certificados en la tabla public.certificaciones!`);

  // Verificar recuento total en la tabla
  const { data: allCerts } = await admin.from('certificaciones').select('id, codigo_verificacion, tipo, estudiante_nombre');
  console.log(`📊 Total registros actuales en public.certificaciones: ${allCerts ? allCerts.length : 0}`);
}

seedCertificaciones();
