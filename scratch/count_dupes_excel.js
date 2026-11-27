const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/USER/.gemini/antigravity/brain/21a0b4ff-30c3-4d2a-8e81-88bc509dcae2/.user_uploaded/media_1795802339529_f80ac338.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

const dniCounts = {};
for (const r of rows) {
  const d = String(r.DNI_CE).trim();
  dniCounts[d] = (dniCounts[d] || 0) + 1;
}

const dupes = Object.keys(dniCounts).filter(d => dniCounts[d] > 1);
console.log('Duplicados en Excel:', dupes.map(d => ({ dni: d, count: dniCounts[d] })));
console.log('Total filas:', rows.length, 'Total DNIs únicos:', Object.keys(dniCounts).length);
