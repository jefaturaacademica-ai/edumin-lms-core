import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';
import { PaqueteDefinicion, PAQUETES_DEFAULT } from '@/lib/types/paquetes';

export type { PaqueteDefinicion };
export { PAQUETES_DEFAULT };

const FILE_PATH = path.join(process.cwd(), 'lib', 'data', 'paquetesConfig.json');

/**
 * Obtiene la lista completa de paquetes configurados
 */
export async function obtenerConfiguracionPaquetes(): Promise<Record<string, PaqueteDefinicion>> {
  // 1. Intentar desde audit_logs (donde se persiste en Supabase como configuración del sistema)
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('audit_logs')
      .select('detalles')
      .eq('accion', 'CONFIGURACION_PAQUETES')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.detalles?.paquetes && typeof data.detalles.paquetes === 'object') {
      return { ...PAQUETES_DEFAULT, ...data.detalles.paquetes };
    }
  } catch (err) {
    console.warn('Advertencia al consultar paquetes en Supabase:', err);
  }

  // 2. Fallback a archivo local
  try {
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...PAQUETES_DEFAULT, ...parsed };
    }
  } catch (err) {
    console.error('Error leyendo paquetesConfig.json:', err);
  }

  return { ...PAQUETES_DEFAULT };
}

/**
 * Guarda la configuración de paquetes en Supabase y localmente
 */
export async function guardarConfiguracionPaquetes(paquetes: Record<string, PaqueteDefinicion>): Promise<boolean> {
  // 1. Guardar localmente
  try {
    const dir = path.dirname(FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(paquetes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error escribiendo paquetesConfig.json:', err);
  }

  // 2. Guardar en Supabase via audit_logs
  try {
    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      usuario_email: 'sistema@edumin.pe',
      accion: 'CONFIGURACION_PAQUETES',
      detalles: {
        paquetes,
        actualizado_en: new Date().toISOString()
      }
    });
  } catch (err) {
    console.warn('Advertencia guardando paquetes en Supabase audit_logs:', err);
  }

  return true;
}
