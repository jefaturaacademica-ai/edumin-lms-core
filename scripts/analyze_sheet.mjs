import fs from 'fs';
import * as XLSX from 'xlsx';

const buf = fs.readFileSync('scripts/cursos_sheet.csv');
const wb = XLSX.read(buf, { type: 'buffer' });
const sheetName = wb.SheetNames[0];
const sheet = wb.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log('Total rows:', data.length);
console.log('Header row (index 0):');
data[0].forEach((col, idx) => {
  const letter = XLSX.utils.encode_col(idx);
  console.log(`Col ${letter} (idx ${idx}): "${col}"`);
});

console.log('\n--- Row 1 (first data row) ---');
data[1].forEach((val, idx) => {
  const letter = XLSX.utils.encode_col(idx);
  console.log(`Col ${letter} (idx ${idx}): "${val}"`);
});

console.log('\n--- Row 2 ---');
data[2].forEach((val, idx) => {
  const letter = XLSX.utils.encode_col(idx);
  console.log(`Col ${letter} (idx ${idx}): "${val}"`);
});
