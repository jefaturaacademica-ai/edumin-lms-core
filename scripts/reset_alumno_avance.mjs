import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function main() {
  console.log('--- REINICIANDO AVANCE DE DIPLOMADOS EN PERFILES DE SUPABASE A 0% ---');

  const { data: profiles, error } = await admin.from('profiles').select('*');
  if (error) {
    console.error('Error al obtener perfiles:', error);
    return;
  }

  console.log(`Perfiles encontrados: ${profiles.length}`);

  for (const prof of profiles) {
    let rawStr = prof.diplomados;
    if (!rawStr) continue;

    let prefix = '';
    let jsonStr = rawStr;

    if (rawStr.startsWith('DIPLOMADOS_LIST|')) {
      prefix = 'DIPLOMADOS_LIST|';
      jsonStr = rawStr.substring('DIPLOMADOS_LIST|'.length);
    }

    try {
      let list = JSON.parse(jsonStr);
      if (Array.isArray(list)) {
        const resetList = list.map((d) => {
          return {
            ...d,
            avance: 0,
            avancePorcentaje: 0,
            completado: false,
            completadosMap: {},
            modulos: Array.isArray(d.modulos) ? d.modulos.map((m) => ({ ...m, completado: false })) : []
          };
        });

        const newDiplomadosVal = prefix ? `${prefix}${JSON.stringify(resetList)}` : JSON.stringify(resetList);

        const { error: updateErr } = await admin
          .from('profiles')
          .update({ diplomados: newDiplomadosVal })
          .eq('id', prof.id);

        if (updateErr) {
          console.error(`Error actualizando perfil ${prof.id}:`, updateErr);
        } else {
          console.log(`✅ Avance de perfil ${prof.dni_ce || prof.id} reiniciado a 0% con éxito!`);
        }
      }
    } catch (e) {
      console.error(`Error parseando JSON de perfil ${prof.id}:`, e);
    }
  }

  console.log('--- RESET COMPLETO A 0% ---');
}

main();
