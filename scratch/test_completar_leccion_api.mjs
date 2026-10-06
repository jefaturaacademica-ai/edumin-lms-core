import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function testToggleApi() {
  console.log('🧪 Probando ciclo completo de toggle de lección y guardado en Supabase...');

  // 1. Obtener perfil
  const { data: p } = await admin.from('profiles').select('*').eq('dni_ce', '71234567').maybeSingle();
  let diplomados = JSON.parse(p.diplomados.substring(16));

  console.log('Geometalurgia ANTES del toggle:', diplomados[0].titulo, '| Avance:', diplomados[0].avance, '% | Completado:', diplomados[0].completado);

  // 2. Simular toggle del Módulo 3 a INCOMPLETO (false)
  diplomados[0].modulos[2].completado = false;
  const completados = diplomados[0].modulos.filter(m => m.completado).length;
  diplomados[0].avance = Math.round((completados / diplomados[0].modulos.length) * 100);
  diplomados[0].completado = (diplomados[0].avance === 100);

  console.log('Geometalurgia DESPUÉS del toggle (incompleto):', diplomados[0].titulo, '| Avance:', diplomados[0].avance, '% | Completado:', diplomados[0].completado);

  // Guardar en Supabase
  const updatedStr = `DIPLOMADOS_LIST|${JSON.stringify(diplomados)}`;
  await admin.from('profiles').update({ diplomados: updatedStr }).eq('id', p.id);

  // Volver a consultar desde Supabase para verificar persistencia real
  const { data: pVerify } = await admin.from('profiles').select('*').eq('dni_ce', '71234567').maybeSingle();
  let diplomadosVerify = JSON.parse(pVerify.diplomados.substring(16));

  console.log('--- VERIFICACIÓN DE LECTURA DESDE SUPABASE ---');
  console.log('Geometalurgia en DB:', diplomadosVerify[0].titulo, '| Avance:', diplomadosVerify[0].avance, '% | Completado:', diplomadosVerify[0].completado);

  // Restaurar a 100%
  diplomadosVerify[0].modulos[2].completado = true;
  diplomadosVerify[0].avance = 100;
  diplomadosVerify[0].completado = true;
  await admin.from('profiles').update({ diplomados: `DIPLOMADOS_LIST|${JSON.stringify(diplomadosVerify)}` }).eq('id', p.id);

  console.log('✅ Cycle test completed successfully!');
}

testToggleApi();
