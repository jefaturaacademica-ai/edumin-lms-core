const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectColumns() {
  const { data: p } = await supabase.from('profiles').select('*').limit(2);
  console.log('Columnas de profiles:', Object.keys(p[0] || {}));
  console.log('Valores de profile[0]:', p[0]);
}

inspectColumns();
