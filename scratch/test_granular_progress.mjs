import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function testGranular() {
  console.log('🧪 Probando guardado granular de lecciones por clase en Supabase...');
  const { data: p } = await admin.from('profiles').select('*').eq('dni_ce', '71234567').maybeSingle();

  let diplomados = JSON.parse(p.diplomados.replace('DIPLOMADOS_LIST|', ''));

  // Buscar DERECHO MINERO (id: derecho-minero)
  const dm = diplomados.find(d => d.id === 'derecho-minero');
  if (dm) {
    console.log('--- DERECHO MINERO ANTES ---');
    console.log('Avance:', dm.avance, '% | Completado:', dm.completado);
    console.log('Módulos:', dm.modulos);

    // Agregar o actualizar mapa de clases completadas granularmente
    dm.completadosMap = dm.completadosMap || {};
    // Marcar solo Clase 1 del Módulo 3
    dm.completadosMap['Módulo 03-c7'] = true;
    dm.completadosMap['Módulo 03-c8'] = false;
    dm.completadosMap['Módulo 03-c9'] = false;

    // Recalcular el porcentaje del diplomado (supongamos 9 clases en total: 5 completadas = 56%)
    dm.avance = 56;
    dm.completado = false;

    const updatedStr = `DIPLOMADOS_LIST|${JSON.stringify(diplomados)}`;
    const { error } = await admin.from('profiles').update({ diplomados: updatedStr }).eq('id', p.id);

    if (error) {
      console.error('Error guardando en Supabase:', error);
    } else {
      console.log('✅ ¡Guardado granular exitoso en Supabase!');
    }
  }

  // Verificar lectura
  const { data: pRead } = await admin.from('profiles').select('*').eq('dni_ce', '71234567').maybeSingle();
  let diplomadosRead = JSON.parse(pRead.diplomados.replace('DIPLOMADOS_LIST|', ''));
  const dmRead = diplomadosRead.find(d => d.id === 'derecho-minero');
  console.log('--- DERECHO MINERO DESPUÉS DE LEER ---');
  console.log('Avance:', dmRead.avance, '% | completadosMap:', dmRead.completadosMap);
}

testGranular();
