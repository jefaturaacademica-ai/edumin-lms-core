import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const MODELOS_POR_DEFECTO = [
  {
    id: 'mod-avanza-dip',
    nombre: 'Superplantilla Oficial Avanza & EDUMIN - Diploma de Alta Especialización',
    tipo: 'DIPLOMA',
    orientacion: 'horizontal',
    horas: '325 horas académicas y 13 créditos académicos',
    firmas: ['Italo Carrera Yepez (Gerente General)', 'Alejandra Alva Porto (Coordinadora Académica)'],
    incluyeQr: true,
    esPredeterminado: true,
    fechaCreacion: '2026-10-15',
    imagenFondoUrl: '/assets/certificates/plantilla_avanza_diploma_bg.png',
    asignacionAlcance: 'SUPERPLANTILLA_GLOBAL',
    recursoAsignadoNombre: 'Todos los diplomados oficiales Avanza - EDUMIN'
  },
  {
    id: 'mod-avanza-mod',
    nombre: 'Superplantilla Oficial Avanza & EDUMIN - Certificado Modular',
    tipo: 'MODULAR',
    orientacion: 'horizontal',
    horas: '108 horas académicas',
    firmas: ['Italo Carrera Yepez (Gerente General)', 'Alejandra Alva Porto (Coordinadora Académica)'],
    incluyeQr: true,
    esPredeterminado: true,
    fechaCreacion: '2026-10-15',
    imagenFondoUrl: '/assets/certificates/plantilla_avanza_modular_bg.png',
    asignacionAlcance: 'SUPERPLANTILLA_GLOBAL',
    recursoAsignadoNombre: 'Todos los módulos de diplomados Avanza - EDUMIN'
  }
];

export async function GET() {
  try {
    const admin = createAdminClient();

    // 1. Intentar consultar si existe tabla dedicada public.modelos_certificados
    try {
      const { data: tableData, error: tableErr } = await admin
        .from('modelos_certificados')
        .select('*')
        .order('created_at', { ascending: false });

      if (!tableErr && tableData && tableData.length > 0) {
        return NextResponse.json({ modelos: tableData, fuente: 'tabla_dedicada' });
      }
    } catch (e) {
      // Ignorar si la tabla aún no existe en el esquema
    }

    // 2. Consultar última configuración guardada en audit_logs de Supabase
    try {
      const { data: logData, error: logErr } = await admin
        .from('audit_logs')
        .select('detalles, created_at')
        .eq('accion', 'CONFIG_MODELOS_CERTIFICADOS')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!logErr && logData?.detalles?.modelos && Array.isArray(logData.detalles.modelos)) {
        return NextResponse.json({ modelos: logData.detalles.modelos, fuente: 'supabase_audit_config' });
      }
    } catch (e) {
      console.warn('Error leyendo audit_logs para modelos:', e);
    }

    // 3. Si no hay configuración previa en Supabase, devolver modelos oficiales por defecto
    return NextResponse.json({ modelos: MODELOS_POR_DEFECTO, fuente: 'por_defecto' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener modelos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { modelos, usuarioEmail } = body;

    if (!Array.isArray(modelos)) {
      return NextResponse.json({ error: 'La lista de modelos es inválida.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Si existe la tabla dedicada public.modelos_certificados, sincronizar
    try {
      const { error: tErr } = await admin.from('modelos_certificados').upsert(modelos);
      if (!tErr) {
        console.log('Modelos sincronizados en tabla dedicada modelos_certificados');
      }
    } catch (e) {
      // Si no existe, continuamos con audit_logs
    }

    // 2. Guardar estado global en audit_logs de Supabase para persistencia multiusuario inmediata
    const { error: logErr } = await admin.from('audit_logs').insert({
      usuario_email: usuarioEmail || 'admin@edumin.pe',
      accion: 'CONFIG_MODELOS_CERTIFICADOS',
      detalles: {
        modelos,
        total: modelos.length,
        timestamp: new Date().toISOString()
      }
    });

    if (logErr) {
      console.error('Error guardando modelos en audit_logs:', logErr);
      return NextResponse.json({ error: logErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Modelos de certificados guardados exitosamente en Supabase.',
      total: modelos.length
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error guardando modelos' }, { status: 500 });
  }
}
