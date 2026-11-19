import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function auditDiplomadosModulos() {
  // Obtenemos todas las preguntas que pertenezcan a diplomados (DIP-01 a DIP-22)
  console.log('Consultando preguntas de Diplomados en Supabase...');
  
  let allRows = [];
  let from = 0;
  const pageSize = 1000;
  
  while (true) {
    const { data, error } = await sb
      .from('banco_preguntas')
      .select('id, codigo_diplomado, diplomado, modulo, dificultad, opciones')
      .like('codigo_diplomado', 'DIP-%')
      .range(from, from + pageSize - 1);
      
    if (error) {
      console.error(error);
      break;
    }
    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  
  console.log(`Total preguntas recuperadas de diplomados: ${allRows.length}`);
  
  // Agrupar por (codigo_diplomado, modulo)
  const map = {};
  
  allRows.forEach(q => {
    const key = `${q.codigo_diplomado}__${q.modulo}`;
    if (!map[key]) {
      map[key] = {
        codigo: q.codigo_diplomado,
        diplomado: q.diplomado,
        modulo: q.modulo,
        medioTotal: 0,
        medioMasLarga: 0,
        altoTotal: 0,
        altoMasLarga: 0,
        total: 0
      };
    }
    
    // Evaluar si la correcta es la más larga
    let maxLen = -1;
    let maxIdx = -1;
    let correctIdx = -1;
    (q.opciones || []).forEach((opt, idx) => {
      const len = (opt.text || '').trim().length;
      if (len > maxLen) {
        maxLen = len;
        maxIdx = idx;
      }
      if (opt.isCorrect) correctIdx = idx;
    });
    
    const esMasLarga = (correctIdx !== -1 && correctIdx === maxIdx);
    
    map[key].total++;
    const dif = (q.dificultad || '').toUpperCase();
    if (dif === 'MEDIO') {
      map[key].medioTotal++;
      if (esMasLarga) map[key].medioMasLarga++;
    } else if (dif === 'ALTO' || dif === 'AVANZADO' || dif === 'DIFICIL') {
      map[key].altoTotal++;
      if (esMasLarga) map[key].altoMasLarga++;
    }
  });
  
  const results = Object.values(map).map(m => {
    const pctMedio = m.medioTotal > 0 ? (m.medioMasLarga / m.medioTotal) * 100 : 0;
    const pctAlto = m.altoTotal > 0 ? (m.altoMasLarga / m.altoTotal) * 100 : 0;
    
    // Evaluar si aplica para regenerar según umbral >= 60%
    // Urgente si >= 75%
    let regenerarMedio = 'NO';
    if (pctMedio >= 75) regenerarMedio = '🚨 SÍ (>=75%)';
    else if (pctMedio >= 60) regenerarMedio = '⚠️ SÍ (>=60%)';

    let regenerarAlto = 'NO';
    if (pctAlto >= 75) regenerarAlto = '🚨 SÍ (>=75%)';
    else if (pctAlto >= 60) regenerarAlto = '⚠️ SÍ (>=60%)';

    let accion = 'Ninguno';
    if (pctMedio >= 60 && pctAlto >= 60) {
      accion = 'MEDIO Y ALTO';
    } else if (pctMedio >= 60) {
      accion = 'SOLO MEDIO';
    } else if (pctAlto >= 60) {
      accion = 'SOLO ALTO';
    }

    return {
      codigo: m.codigo,
      diplomado: m.diplomado,
      modulo: m.modulo,
      medioTotal: m.medioTotal,
      pctMedio: pctMedio.toFixed(1),
      altoTotal: m.altoTotal,
      pctAlto: pctAlto.toFixed(1),
      accion,
      regenerarMedio,
      regenerarAlto
    };
  });
  
  // Ordenar por código de diplomado y luego por módulo
  results.sort((a,b) => {
    if (a.codigo !== b.codigo) return a.codigo.localeCompare(b.codigo);
    return a.modulo.localeCompare(b.modulo);
  });
  
  fs.writeFileSync('C:/Users/HP/.gemini/antigravity/brain/d80c9471-0b3f-4281-8e99-3de3bd4f5db5/scratch/modulos_audit.json', JSON.stringify(results, null, 2));
  console.log(`Auditoría guardada. Total módulos evaluados: ${results.length}`);
  
  console.log('\n--- RESUMEN DE MÓDULOS ---');
  console.log('Requieren MEDIO Y ALTO (>=60%):', results.filter(r => r.accion === 'MEDIO Y ALTO').length);
  console.log('Requieren SOLO MEDIO (>=60%):', results.filter(r => r.accion === 'SOLO MEDIO').length);
  console.log('Requieren SOLO ALTO (>=60%):', results.filter(r => r.accion === 'SOLO ALTO').length);
  console.log('No requieren regeneración (<60%):', results.filter(r => r.accion === 'Ninguno').length);
}

auditDiplomadosModulos();
