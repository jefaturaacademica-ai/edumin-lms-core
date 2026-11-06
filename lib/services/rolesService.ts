import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';
import { 
  RolePermisoDefinicion, 
  ROLES_PREDEFINIDOS, 
  SIDEBAR_MODULOS_EDUMIN 
} from '@/lib/types/roles';

export { ROLES_PREDEFINIDOS, SIDEBAR_MODULOS_EDUMIN };
export type { RolePermisoDefinicion };

const FILE_PATH = path.join(process.cwd(), 'lib', 'data', 'rolesConfig.json');

/**
 * Obtiene la configuración de todos los roles (predefinidos y personalizados)
 */
export async function obtenerConfiguracionRoles(): Promise<Record<string, RolePermisoDefinicion>> {
  // 1. Intentar desde audit_logs en Supabase
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('audit_logs')
      .select('detalles')
      .eq('accion', 'CONFIGURACION_ROLES_PERMISOS')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data?.detalles?.roles && typeof data.detalles.roles === 'object') {
      return { ...ROLES_PREDEFINIDOS, ...data.detalles.roles };
    }
  } catch (err) {
    console.warn('Advertencia al consultar roles en Supabase audit_logs:', err);
  }

  // 2. Fallback a archivo JSON local
  try {
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...ROLES_PREDEFINIDOS, ...parsed };
    }
  } catch (err) {
    console.error('Error leyendo rolesConfig.json:', err);
  }

  return { ...ROLES_PREDEFINIDOS };
}

/**
 * Guarda la configuración de roles en Supabase y localmente
 */
export async function guardarConfiguracionRoles(roles: Record<string, RolePermisoDefinicion>): Promise<boolean> {
  // 1. Guardar localmente
  try {
    const dir = path.dirname(FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(roles, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error escribiendo rolesConfig.json:', err);
  }

  // 2. Persistir en Supabase audit_logs
  try {
    const admin = createAdminClient();
    await admin.from('audit_logs').insert({
      usuario_email: 'admin@edumin.pe',
      accion: 'CONFIGURACION_ROLES_PERMISOS',
      detalles: {
        timestamp: new Date().toISOString(),
        roles
      }
    });
    return true;
  } catch (err) {
    console.error('Error guardando roles en audit_logs de Supabase:', err);
    return false;
  }
}
