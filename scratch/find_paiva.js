const XLSX = require('xlsx');
const wb = XLSX.readFile('C:/Users/USER/.gemini/antigravity/brain/21a0b4ff-30c3-4d2a-8e81-88bc509dcae2/.user_uploaded/media_1795802339529_f80ac338.xlsx');
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

const matches = rows.filter(x => String(x.DNI_CE).includes('73901770') || String(x.APELLIDOS).toLowerCase().includes('paiva'));
console.log('Matches en Excel:', matches);
