const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/USER/.gemini/antigravity/brain/21a0b4ff-30c3-4d2a-8e81-88bc509dcae2/.user_uploaded/media_1795802339529_f80ac338.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
const r = rows.find(x => String(x.DNI_CE).trim() === '73901770');
console.log('Fila en Excel de Carlos Paiva:', r);
const r2 = rows.find(x => String(x.DNI_CE).trim() === '71852289');
console.log('Fila en Excel de Harrinson Salcedo:', r2);
