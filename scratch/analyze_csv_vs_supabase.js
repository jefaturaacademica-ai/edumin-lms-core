const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function parseCSV(content) {
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const header = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Manejar comillas en CSV simple
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      let val = match[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      matches.push(val.trim());
      if (regex.lastIndex >= line.length) break;
    }
    // Asegurar columnas
    const row = {};
    header.forEach((h, idx) => {
      row[h] = matches[idx] !== undefined ? matches[idx] : '';
    });
    row._lineNum = i + 1;
    rows.push(row);
  }
  return rows;
}

async function analyze() {
  const content = fs.readFileSync('C:/Users/USER/Documents/GitHub/edumin-lms-core/scratch/datos_alumnos.csv', 'utf8');
  const rows = parseCSV(content);

  console.log(`=== Total filas en CSV: ${rows.length} ===`);

  // 1. Detectar duplicados en el CSV
  const dniCounts = {};
  const emailCounts = {};
  rows.forEach(r => {
    const dni = r.DNI_CE;
    const email = r.EMAIL.toLowerCase();
    if (dni) {
      dniCounts[dni] = dniCounts[dni] || [];
      dniCounts[dni].push(r);
    }
    if (email) {
      emailCounts[email] = emailCounts[email] || [];
      emailCounts[email].push(r);
    }
  });

  const dupDnis = Object.entries(dniCounts).filter(([k, v]) => v.length > 1);
  const dupEmails = Object.entries(emailCounts).filter(([k, v]) => v.length > 1);

  console.log(`\n=== 1. DUPLICADOS EN EL CSV ===`);
  console.log(`DNIs duplicados encontrados: ${dupDnis.length}`);
  dupDnis.forEach(([dni, records]) => {
    console.log(`\n>>> DNI DUPLICADO: ${dni} (${records.length} veces):`);
    records.forEach(rec => {
      console.log(`  - Fila ${rec._lineNum}: ${rec.NOMBRES} ${rec.APELLIDOS} | Paquete: ${rec.PAQUETE} | Diplomado: ${rec.DIPLOMADO_INICIAL} | Monto: ${rec.MONTO_TOTAL} (Cuotas: ${rec.TOTAL_CUOTAS}) | Email: ${rec.EMAIL}`);
    });
  });

  console.log(`\nEmails duplicados encontrados: ${dupEmails.length}`);
  dupEmails.forEach(([email, records]) => {
    if (!dupDnis.some(([d]) => d === records[0].DNI_CE)) {
      console.log(`\n>>> EMAIL DUPLICADO (DNI DISTINTO): ${email}:`);
      records.forEach(rec => {
        console.log(`  - Fila ${rec._lineNum}: DNI ${rec.DNI_CE} | ${rec.NOMBRES} ${rec.APELLIDOS}`);
      });
    }
  });

  // 2. Consultar Supabase
  console.log(`\n=== 2. COMPARACIÓN CON SUPABASE ===`);
  const { data: allProfiles, error: errProf } = await supabase
    .from('profiles')
    .select('id, numero_documento, email, nombres, apellidos, telefono, paquete_adquirido, cupos_creditos, diplomados');

  const { data: allPagos, error: errPag } = await supabase
    .from('pagos')
    .select('*');

  if (errProf || errPag) {
    console.error('Error al consultar Supabase:', errProf, errPag);
    process.exit(1);
  }

  const profileMap = new Map();
  allProfiles.forEach(p => {
    if (p.numero_documento) profileMap.set(p.numero_documento, p);
  });

  const pagosByProfile = new Map();
  allPagos.forEach(pag => {
    const list = pagosByProfile.get(pag.profile_id) || [];
    list.push(pag);
    pagosByProfile.set(pag.profile_id, list);
  });

  const noEncontrados = [];
  const discrepanciasPaquete = [];
  const discrepanciasMonto = [];
  const coincidentes = [];

  rows.forEach(r => {
    const prof = profileMap.get(r.DNI_CE);
    if (!prof) {
      noEncontrados.push(r);
      return;
    }

    // Verificar paquete
    let pkgCsv = r.PAQUETE.toUpperCase().trim();
    if (pkgCsv === 'ESTÁNDAR') pkgCsv = 'ESTANDAR';
    if (pkgCsv === 'BÁSICO') pkgCsv = 'BASICO';
    if (pkgCsv === 'AVANZADO - 2') pkgCsv = 'AVANZADO_2';
    if (pkgCsv === 'AMNISTÍA') pkgCsv = 'AMNISTIA';

    const pkgSupa = (prof.paquete_adquirido || '').toUpperCase().trim();
    if (pkgCsv !== pkgSupa) {
      discrepanciasPaquete.push({
        fila: r._lineNum,
        dni: r.DNI_CE,
        nombre: `${r.NOMBRES} ${r.APELLIDOS}`,
        csvPaquete: r.PAQUETE,
        supaPaquete: prof.paquete_adquirido
      });
    }

    // Verificar monto
    const pagosList = pagosByProfile.get(prof.id) || [];
    const montoCsv = Number(r.MONTO_TOTAL || 0);
    const montoPagos = pagosList.length > 0 ? Number(pagosList[0].monto || 0) : 0;
    if (montoCsv > 0 && montoPagos > 0 && Math.abs(montoCsv - montoPagos) > 1) {
      discrepanciasMonto.push({
        fila: r._lineNum,
        dni: r.DNI_CE,
        nombre: `${r.NOMBRES} ${r.APELLIDOS}`,
        montoCsv,
        montoSupa: montoPagos,
        pagosCount: pagosList.length
      });
    }
  });

  console.log(`Total filas CSV: ${rows.length}`);
  console.log(`Alumnos no encontrados en Supabase: ${noEncontrados.length}`);
  if (noEncontrados.length > 0) {
    noEncontrados.forEach(ne => console.log(`  - No en BD: DNI ${ne.DNI_CE} (${ne.NOMBRES} ${ne.APELLIDOS})`));
  }

  console.log(`\nDiscrepancias de PAQUETE (CSV vs Supabase): ${discrepanciasPaquete.length}`);
  console.log(JSON.stringify(discrepanciasPaquete, null, 2));

  console.log(`\nDiscrepancias de MONTO TOTAL (CSV vs Supabase): ${discrepanciasMonto.length}`);
  console.log(JSON.stringify(discrepanciasMonto.slice(0, 15), null, 2));

  process.exit(0);
}

analyze();
