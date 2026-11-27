const fs = require('fs');

const content = fs.readFileSync('C:/Users/USER/Documents/GitHub/edumin-lms-core/scratch/datos_alumnos.csv', 'utf8');
const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);

// Use a proper CSV parser for quoted fields
function parseLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

const header = parseLine(lines[0]);
const rows = [];
for (let i = 1; i < lines.length; i++) {
  const parts = parseLine(lines[i]);
  const row = {};
  header.forEach((h, idx) => {
    row[h] = parts[idx] || '';
  });
  row.lineNum = i + 1;
  rows.push(row);
}

console.log('Total parsed rows:', rows.length);

// 1. DNI duplicates
const dniMap = {};
rows.forEach(r => {
  if (r.DNI_CE) {
    dniMap[r.DNI_CE] = dniMap[r.DNI_CE] || [];
    dniMap[r.DNI_CE].push(r);
  }
});

console.log('\n=== DNI DUPLICADOS ===');
Object.entries(dniMap).filter(([k, v]) => v.length > 1).forEach(([dni, list]) => {
  console.log(`DNI ${dni} (${list.length} registros):`);
  list.forEach(r => {
    console.log(`  Fila ${r.lineNum}: ${r.NOMBRES} ${r.APELLIDOS} | Paquete: ${r.PAQUETE} | Diplomado: ${r.DIPLOMADO_INICIAL} | Monto: ${r.MONTO_TOTAL} | Cuotas: ${r.TOTAL_CUOTAS} | Email: ${r.EMAIL}`);
  });
});

// 2. Email duplicates
const emailMap = {};
rows.forEach(r => {
  const em = (r.EMAIL || '').toLowerCase();
  if (em) {
    emailMap[em] = emailMap[em] || [];
    emailMap[em].push(r);
  }
});

console.log('\n=== EMAIL DUPLICADOS ===');
Object.entries(emailMap).filter(([k, v]) => v.length > 1).forEach(([em, list]) => {
  console.log(`Email ${em} (${list.length} registros):`);
  list.forEach(r => {
    console.log(`  Fila ${r.lineNum}: DNI ${r.DNI_CE} | ${r.NOMBRES} ${r.APELLIDOS} | Paquete: ${r.PAQUETE}`);
  });
});

// 3. Telefono duplicates
const telMap = {};
rows.forEach(r => {
  const tel = (r.TELEFONO || '').replace(/\D/g, '');
  if (tel.length >= 8) {
    telMap[tel] = telMap[tel] || [];
    telMap[tel].push(r);
  }
});

console.log('\n=== TELEFONO DUPLICADOS ===');
Object.entries(telMap).filter(([k, v]) => v.length > 1).forEach(([tel, list]) => {
  console.log(`Teléfono ${tel} (${list.length} registros):`);
  list.forEach(r => {
    console.log(`  Fila ${r.lineNum}: DNI ${r.DNI_CE} | ${r.NOMBRES} ${r.APELLIDOS} | Paquete: ${r.PAQUETE}`);
  });
});

// 4. Nombres similares / repetidos
const nameMap = {};
rows.forEach(r => {
  const n = `${r.NOMBRES} ${r.APELLIDOS}`.toLowerCase().replace(/[^a-záéíóúñ]/gi, ' ').replace(/\s+/g, ' ').trim();
  nameMap[n] = nameMap[n] || [];
  nameMap[n].push(r);
});

console.log('\n=== NOMBRES DUPLICADOS ===');
Object.entries(nameMap).filter(([k, v]) => v.length > 1).forEach(([n, list]) => {
  console.log(`Nombre: "${n}" (${list.length} registros):`);
  list.forEach(r => {
    console.log(`  Fila ${r.lineNum}: DNI ${r.DNI_CE} | Paquete: ${r.PAQUETE} | Diplomado: ${r.DIPLOMADO_INICIAL}`);
  });
});
