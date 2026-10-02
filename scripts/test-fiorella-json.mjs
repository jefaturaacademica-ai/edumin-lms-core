import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function testUpdateFiorellaJson() {
  console.log('=== GUARDANDO ESTRUCTURA JSON DE DIPLOMADOS Y MÓDULOS PARA FIORELLA BEATRIZ ===');

  const diplomadosJson = [
    {
      id: 'geometalurgia',
      slug: 'geometalurgia',
      titulo: 'GEOMETALURGIA',
      avance: 67,
      modulos: [
        { id: 'mod-01', codigo: 'Módulo 01', nombre: 'GEOTECNIA DE SUELOS Y ROCAS', nota: 17, completado: true },
        { id: 'mod-02', codigo: 'Módulo 02', nombre: 'MONITOREO GEOTÉCNICO', nota: 18, completado: true },
        { id: 'mod-03', codigo: 'Módulo 03', nombre: 'ANÁLISIS HIDROGEOLÓGICO', nota: 0, completado: false }
      ]
    }
  ];

  const cursosJson = [
    {
      id: 'cur-01',
      codigo: 'CUR-01',
      titulo: 'MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783',
      nota: 18,
      completado: true
    }
  ];

  const diplomadosSerialized = `DIPLOMADOS_LIST|${JSON.stringify(diplomadosJson)}`;
  const cursosSerialized = `CURSOS_LIST|${JSON.stringify(cursosJson)}`;

  const { data, error } = await admin
    .from('profiles')
    .update({
      diplomado_1: diplomadosSerialized,
      diplomado_2: cursosSerialized
    })
    .eq('dni_ce', '74567890')
    .select();

  if (error) {
    console.error('Error al actualizar:', error);
  } else {
    console.log('✅ Perfil de Fiorella actualizado exitosamente en Supabase:');
    console.log('diplomado_1:', data[0].diplomado_1);
    console.log('diplomado_2:', data[0].diplomado_2);
  }
}

testUpdateFiorellaJson();
