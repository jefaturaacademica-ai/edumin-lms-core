import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';

export interface BienvenidaConfig {
  mensajePlantilla: string; // Ej: "¡Hola, {nombre}, bienvenido a tu portal de especialización ejecutiva!"
  imagenFondo: string;
}

const FILE_PATH = path.join(process.cwd(), 'lib', 'data', 'bienvenidaConfig.json');

export const BIENVENIDA_DEFAULT: BienvenidaConfig = {
  mensajePlantilla: '¡Hola, {nombre}, bienvenido a tu portal de especialización ejecutiva!',
  imagenFondo: 'https://img.magnific.com/foto-gratis/retrato-ingenieros-horas-trabajo-sitio-trabajo_23-2151589536.jpg?semt=ais_hybrid&w=740&q=80'
};

export async function obtenerConfiguracionBienvenida(): Promise<BienvenidaConfig> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('configuraciones_sistema')
      .select('valor')
      .eq('id', 'bienvenida_dashboard')
      .maybeSingle();

    if (data?.valor && typeof data.valor === 'object') {
      return { ...BIENVENIDA_DEFAULT, ...data.valor };
    }
  } catch {
    // Si no existe la tabla o falla supabase, fallback local
  }

  try {
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, 'utf-8');
      return { ...BIENVENIDA_DEFAULT, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error leyendo bienvenidaConfig.json:', err);
  }

  return { ...BIENVENIDA_DEFAULT };
}

export async function guardarConfiguracionBienvenida(config: BienvenidaConfig): Promise<boolean> {
  try {
    const dir = path.dirname(FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error escribiendo bienvenidaConfig.json:', err);
  }

  try {
    const admin = createAdminClient();
    await admin.from('configuraciones_sistema').upsert({
      id: 'bienvenida_dashboard',
      valor: config,
      updated_at: new Date().toISOString()
    });
    return true;
  } catch {
    return true;
  }
}
