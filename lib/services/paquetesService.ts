import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';
import { PaqueteDefinicion, PAQUETES_DEFAULT } from '@/lib/types/paquetes';

export type { PaqueteDefinicion };
export { PAQUETES_DEFAULT };

const FILE_PATH = path.join(process.cwd(), 'lib', 'data', 'paquetesConfig.json');

function rowToPaquete(row: any): PaqueteDefinicion {
  return {
    id: String(row.id),
    nombre: String(row.nombre || row.id),
    descripcion: String(row.descripcion || ''),
    precioContado: Number(row.precio_contado ?? 0),
    precioCuotas: Number(row.precio_cuotas ?? 0),
    cuotasSugeridas: Number(row.cuotas_sugeridas ?? 1),
    creditosDiplomados: Number(row.creditos_diplomados ?? 1),
    creditosCursos: Number(row.creditos_cursos ?? 0),
    duracionMeses: Number(row.duracion_meses ?? (row.id === 'ILIMITADO' ? 24 : 12)),
    diplomadosRenovables: Boolean(row.diplomados_renovables ?? (row.id === 'ILIMITADO')),
    modulares: Number(row.modulares ?? 3),
    diplomas: Number(row.diplomas ?? 1),
    certCip: Boolean(row.cert_cip),
    certInternacional: Boolean(row.cert_internacional),
    bolsaTrabajoRegular: row.bolsa_trabajo_regular !== false,
    bolsaTrabajoExclusiva: Boolean(row.bolsa_trabajo_exclusiva),
    dreambuilder: row.dreambuilder !== false,
    esPersonalizado: Boolean(row.es_personalizado),
    colorTag: String(row.color_tag || (row.es_personalizado ? 'emerald' : 'indigo')),
  };
}

function paqueteToRow(pkg: PaqueteDefinicion, orden: number) {
  return {
    id: pkg.id,
    nombre: pkg.nombre,
    descripcion: pkg.descripcion || '',
    precio_contado: Number(pkg.precioContado ?? 0),
    precio_cuotas: Number(pkg.precioCuotas ?? 0),
    cuotas_sugeridas: Number(pkg.cuotasSugeridas ?? 1),
    creditos_diplomados: Number(pkg.creditosDiplomados ?? 1),
    creditos_cursos: Number(pkg.creditosCursos ?? 0),
    duracion_meses: Number(pkg.duracionMeses ?? (pkg.id === 'ILIMITADO' ? 24 : 12)),
    diplomados_renovables: Boolean(pkg.diplomadosRenovables ?? (pkg.id === 'ILIMITADO')),
    modulares: Number(pkg.modulares ?? 3),
    diplomas: Number(pkg.diplomas ?? 1),
    cert_cip: Boolean(pkg.certCip),
    cert_internacional: Boolean(pkg.certInternacional),
    bolsa_trabajo_regular: pkg.bolsaTrabajoRegular !== false,
    bolsa_trabajo_exclusiva: Boolean(pkg.bolsaTrabajoExclusiva),
    dreambuilder: pkg.dreambuilder !== false,
    es_personalizado: Boolean(pkg.esPersonalizado),
    color_tag: pkg.colorTag || (pkg.esPersonalizado ? 'emerald' : 'indigo'),
    orden,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Obtiene la lista completa de paquetes configurados
 */
export async function obtenerConfiguracionPaquetes(): Promise<Record<string, PaqueteDefinicion>> {
  const admin = createAdminClient();

  // 1. Intentar desde la tabla dedicada public.paquetes
  try {
    const { data: rows, error } = await admin
      .from('paquetes')
      .select('*')
      .order('orden', { ascending: true })
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(rows) && rows.length > 0) {
      const dict: Record<string, PaqueteDefinicion> = {};
      for (const r of rows) {
        dict[r.id] = rowToPaquete(r);
      }
      return dict;
    }
  } catch (err) {
    console.warn('Tabla public.paquetes aún no disponible, usando respaldo audit_logs:', err);
  }

  // 2. Respaldo desde audit_logs
  try {
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

  // 3. Fallback a archivo local
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
 * Guarda la configuración de paquetes en public.paquetes, audit_logs y localmente
 */
export async function guardarConfiguracionPaquetes(paquetes: Record<string, PaqueteDefinicion>): Promise<boolean> {
  const admin = createAdminClient();

  // 1. Guardar localmente (en entornos con FS escribible)
  try {
    const dir = path.dirname(FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(FILE_PATH, JSON.stringify(paquetes, null, 2), 'utf-8');
  } catch {
    // En Vercel el filesystem es de solo lectura
  }

  // 2. Sincronizar con la tabla dedicada public.paquetes (upsert + eliminar códigos removidos/renombrados)
  try {
    const lista = Object.values(paquetes);
    const rows = lista.map((pkg, idx) => paqueteToRow(pkg, idx + 1));

    if (rows.length > 0) {
      const { error: upsertErr } = await admin
        .from('paquetes')
        .upsert(rows, { onConflict: 'id' });

      if (!upsertErr) {
        const idsActivos = new Set(lista.map(p => p.id));
        const { data: existentes } = await admin.from('paquetes').select('id');
        const idsABorrar = (existentes || []).map((r: any) => r.id).filter((id: string) => !idsActivos.has(id));
        if (idsABorrar.length > 0) {
          await admin.from('paquetes').delete().in('id', idsABorrar);
        }
      }
    }
  } catch (err) {
    console.warn('Advertencia sincronizando tabla public.paquetes:', err);
  }

  // 3. Guardar también en audit_logs como historial/respaldo
  try {
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
