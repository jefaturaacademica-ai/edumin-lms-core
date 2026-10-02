import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function checkAuthUsers() {
  console.log('=== VERIFICANDO FIORELLA Y TODOS LOS USUARIOS EN AUTH.USERS Y PROFILES ===');

  const { data: profiles } = await admin.from('profiles').select('*');
  console.log(`Total perfiles en public.profiles: ${profiles.length}`);

  for (const p of profiles) {
    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(p.id);
    if (authError || !authUser?.user) {
      console.log(`⚠️ DESALINEADO: El perfil ${p.nombres} ${p.apellidos} (DNI ${p.dni_ce}, ID ${p.id}) NO EXISTE en auth.users!`);
      // Crear usuario en auth.users con la misma ID
      const userEmail = p.email || `${p.dni_ce}@edumin.pe`;
      const pwd = (p.contrasena && p.contrasena.trim()) ? p.contrasena.trim() : p.dni_ce;

      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        id: p.id,
        email: userEmail,
        password: pwd,
        email_confirm: true,
        user_metadata: { dni_ce: p.dni_ce }
      });

      if (createErr) {
        console.error(`❌ Error al crear auth user para ${p.dni_ce}:`, createErr.message);
      } else {
        console.log(`✅ CREADO EXITOSAMENTE usuario auth para ${p.nombres} (${userEmail})`);
      }
    } else {
      console.log(`✅ ALINEADO: Perfil ${p.nombres} (${p.dni_ce}) coincide con auth.users (ID: ${p.id})`);
    }
  }
}

checkAuthUsers();
