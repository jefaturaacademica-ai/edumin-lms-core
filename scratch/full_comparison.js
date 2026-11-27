const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function parseLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '\"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) { result.push(cur.trim()); cur = ''; }
    else cur += c;
  }
  result.push(cur.trim());
  return result;
}

async function run() {
  const content = fs.readFileSync('C:/Users/USER/Documents/GitHub/edumin-lms-core/scratch/datos_alumnos.csv', 'utf8');
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const header = parseLine(lines[0]);
  const rows = lines.slice(1).map((l, idx) => {
    const parts = parseLine(l);
    const r = {};
    header.forEach((h, i) => { r[h] = parts[i] || ''; });
    r.lineNum = idx + 2;
    return r;
  });

  const { data: profiles } = await supabase.from('profiles').select('*');
  const { data: pagos } = await supabase.from('pagos').select('*');

  const profMap = new Map();
  profiles.forEach(p => profMap.set(p.numero_documento, p));

  const pagosMap = new Map();
  pagos.forEach(p => {
    const list = pagosMap.get(p.dni_ce) || [];
    list.push(p);
    pagosMap.set(p.dni_ce, list);
  });

  const paqueteDiffs = [];
  const montoDiffs = [];
  const diplomadoDiffs = [];

  rows.forEach(r => {
    const prof = profMap.get(r.DNI_CE);
    if (!prof) return;

    let csvPkg = r.PAQUETE.toUpperCase().trim();
    if (csvPkg === 'ESTÁNDAR') csvPkg = 'ESTANDAR';
    if (csvPkg === 'BÁSICO') csvPkg = 'BASICO';
    if (csvPkg === 'AVANZADO - 2') csvPkg = 'AVANZADO_2';
    if (csvPkg === 'AMNISTÍA') csvPkg = 'AMNISTIA';

    if (prof.paquete_adquirido !== csvPkg) {
      paqueteDiffs.push({
        line: r.lineNum,
        dni: r.DNI_CE,
        nombre: `${r.NOMBRES} ${r.APELLIDOS}`,
        csv: r.PAQUETE,
        normalizado: csvPkg,
        supabase: prof.paquete_adquirido
      });
    }

    const pagosList = pagosMap.get(r.DNI_CE) || [];
    const csvMonto = Number(r.MONTO_TOTAL || 0);
    const supaMonto = pagosList.length > 0 ? Number(pagosList[0].monto || 0) : 0;
    if (csvMonto > 0 && supaMonto > 0 && Math.abs(csvMonto - supaMonto) > 1) {
      montoDiffs.push({
        line: r.lineNum,
        dni: r.DNI_CE,
        nombre: `${r.NOMBRES} ${r.APELLIDOS}`,
        csvMonto,
        supaMonto
      });
    }

    // Check diplomado
    const csvDip = r.DIPLOMADO_INICIAL.toUpperCase().trim();
    let supaDip = '';
    if (prof.diplomados && prof.diplomados.startsWith('DIPLOMADOS_LIST|')) {
      try {
        const list = JSON.parse(prof.diplomados.replace('DIPLOMADOS_LIST|', ''));
        if (list.length > 0) supaDip = (list[0].titulo || '').toUpperCase().trim();
      } catch (e) {}
    }
    if (csvDip && supaDip && !supaDip.includes(csvDip) && !csvDip.includes(supaDip)) {
      diplomadoDiffs.push({
        line: r.lineNum,
        dni: r.DNI_CE,
        nombre: `${r.NOMBRES} ${r.APELLIDOS}`,
        csvDip,
        supaDip
      });
    }
  });

  console.log('=== RESULTADO COMPARACIÓN TOTAL ===');
  console.log('Total filas analizadas:', rows.length);
  console.log('Diferencias de PAQUETE:', paqueteDiffs.length);
  console.log('Detalle diferencias de paquete:', JSON.stringify(paqueteDiffs, null, 2));
  console.log('Diferencias de MONTO:', montoDiffs.length);
  console.log('Detalle diferencias de monto:', JSON.stringify(montoDiffs, null, 2));
  console.log('Diferencias de DIPLOMADO INICIAL:', diplomadoDiffs.length);
  console.log('Detalle diferencias de diplomado:', JSON.stringify(diplomadoDiffs, null, 2));

  process.exit(0);
}
run();
