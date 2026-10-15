import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const sb = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function check() {
  const { data: rows } = await sb.from('diplomados_lecciones').select('*');
  console.log('Total diplomados_lecciones rows:', rows?.length);

  // Check any Material1..8
  const withMat = rows.filter(r => r.Material1 || r.Material2 || r.Material3 || r.Material4 || r.Material5 || r.Material6 || r.Material7 || r.Material8);
  console.log('Rows with Material1..8 in diplomados_lecciones:', withMat.length);
  withMat.forEach(r => {
    console.log('Material found on:', r.CodigoDiplomado, r.Diplomado, r.Modulo, r.Tema, r.Sesion);
    console.log('Mat1:', r.Material1, 'Mat2:', r.Material2, 'Mat3:', r.Material3);
  });

  // Check any ResumenVideoUrl
  const withResumenVideo = rows.filter(r => r.ResumenVideoUrl);
  console.log('Rows with ResumenVideoUrl:', withResumenVideo.length);
  withResumenVideo.forEach(r => {
    console.log('ResumenVideo on:', r.CodigoDiplomado, r.Diplomado, r.Modulo, r.Sesion, '->', r.ResumenVideoUrl);
  });

  // Check audit_logs to see what the user did recently!
  const { data: logs } = await sb.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10);
  console.log('Recent audit logs:');
  logs.forEach(l => {
    console.log(l.created_at, l.usuario_email, l.accion, JSON.stringify(l.detalles));
  });
}
check();
