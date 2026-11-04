import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Reading cursos_clases.xlsx...');
  const workbook = XLSX.readFile('cursos_clases.xlsx');
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const excelRows = XLSX.utils.sheet_to_json(sheet);

  console.log(`Loaded ${excelRows.length} rows from Excel.`);

  // Fetch all existing lecciones for courses and workshops
  const { data: dbLecciones, error: fetchErr } = await supabase
    .from('lecciones')
    .select('id, CodigoDiplomado, Diplomado, Tema, Sesion, PdfUrl')
    .or('CodigoDiplomado.ilike.CUR%,CodigoDiplomado.ilike.TAL%');

  if (fetchErr) {
    console.error('Error fetching DB lecciones:', fetchErr);
    process.exit(1);
  }

  console.log(`Found ${dbLecciones.length} course/workshop lecciones in Supabase.`);

  let updatedCount = 0;
  let alreadyUpToDate = 0;
  let notFound = [];
  const errors = [];

  for (let i = 0; i < excelRows.length; i++) {
    const row = excelRows[i];
    const cod = (row['Código'] || '').trim().toUpperCase();
    const tema = (row['Nombre de la Clase'] || '').trim();
    const pdfUrl = (row['Link Material / PDF'] || '').trim();

    if (!pdfUrl) {
      console.warn(`Row ${i + 1} (${cod}) has no Link Material / PDF`);
      continue;
    }

    // Match with dbLecciones
    const target = dbLecciones.find(l => 
      l.CodigoDiplomado?.trim().toUpperCase() === cod && 
      l.Tema?.trim().toLowerCase() === tema.toLowerCase()
    );

    if (!target) {
      notFound.push({ cod, tema });
      continue;
    }

    if (target.PdfUrl === pdfUrl) {
      alreadyUpToDate++;
      continue;
    }

    const { error: updateErr } = await supabase
      .from('lecciones')
      .update({
        PdfUrl: pdfUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', target.id);

    if (updateErr) {
      errors.push({ id: target.id, cod, error: updateErr.message });
    } else {
      updatedCount++;
    }

    if ((updatedCount + alreadyUpToDate) % 25 === 0) {
      console.log(`Progress: ${updatedCount + alreadyUpToDate} / ${excelRows.length}...`);
    }
  }

  console.log('Update summary:', {
    totalExcelRows: excelRows.length,
    updatedCount,
    alreadyUpToDate,
    notFoundCount: notFound.length,
    errorsCount: errors.length
  });

  if (notFound.length > 0) {
    console.warn('First 5 not found:', notFound.slice(0, 5));
  }
  if (errors.length > 0) {
    console.error('First 5 errors:', errors.slice(0, 5));
  }

  // Verification: Query count of lecciones with PdfUrl not null
  const { data: verified, error: verErr } = await supabase
    .from('lecciones')
    .select('id, CodigoDiplomado, PdfUrl')
    .or('CodigoDiplomado.ilike.CUR%,CodigoDiplomado.ilike.TAL%')
    .not('PdfUrl', 'is', null);

  console.log(`Verification: Total course/workshop lecciones in Supabase with PdfUrl: ${verified?.length}`);
}

main().catch(console.error);
