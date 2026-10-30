import fs from 'fs';

async function testParse() {
  const url = 'https://docs.google.com/spreadsheets/d/1kKQzkJOIdL3xq3Xkfe1rINqT-8lo_BY8Y4-GNuEF-pU/export?format=csv&gid=256210753';
  const res = await fetch(url);
  const csv = await res.text();
  
  // Simple csv row parser or regex
  // Let's save it to a file so we can inspect and work with it
  fs.writeFileSync('scripts/cursos_sheet.csv', csv, 'utf8');
  console.log('Saved csv, size:', csv.length);
}
testParse();
