import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  type ModoLoginContenido, 
  type LoginBannerConfig, 
  type PlantillaLogin,
  PLANTILLAS_PREDEFINIDAS 
} from '@/lib/types/loginBanner';

export type { ModoLoginContenido, LoginBannerConfig, PlantillaLogin };
export { PLANTILLAS_PREDEFINIDAS };

const CONFIG_FILE_PATH = path.join(process.cwd(), 'lib', 'data', 'loginBannerConfig.json');

const DEFAULT_CONFIG: LoginBannerConfig = {
  modo: 'contactos',
  tituloCampana: 'Canales de soporte institucional',
  htmlPersonalizado: '',
  fechaActualizacion: new Date().toISOString()
};

/**
 * Obtiene la configuración activa del login desde Supabase o archivo local
 */
export async function obtenerConfiguracionLogin(): Promise<LoginBannerConfig> {
  // 1. Intentar desde Supabase
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('configuraciones_sistema')
      .select('valor')
      .eq('id', 'login_banner')
      .maybeSingle();

    if (!error && data?.valor) {
      return { ...DEFAULT_CONFIG, ...(data.valor as LoginBannerConfig) };
    }
  } catch {
    // Si la tabla aún no existe, continúa con el archivo local
  }

  // 2. Fallback persistente a archivo local
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Error leyendo loginBannerConfig.json:', err);
  }

  return DEFAULT_CONFIG;
}

/**
 * Guarda la configuración en Supabase y sincroniza con el archivo local
 */
export async function guardarConfiguracionLogin(config: LoginBannerConfig): Promise<boolean> {
  const configFinal: LoginBannerConfig = {
    ...config,
    fechaActualizacion: new Date().toISOString()
  };

  // 1. Guardar en archivo local
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(configFinal, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error escribiendo loginBannerConfig.json:', err);
  }

  // 2. Intentar guardar en Supabase
  try {
    const admin = createAdminClient();
    await admin
      .from('configuraciones_sistema')
      .upsert({
        id: 'login_banner',
        valor: configFinal,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
  } catch {
    // Si la tabla de Supabase no está creada aún, no detiene el funcionamiento
  }

  return true;
}
