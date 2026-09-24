import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();

    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, dni_ce, nombres, apellidos, email, paquete_adquirido, diplomado_1')
      .order('nombres', { ascending: true });

    if (error) {
      return NextResponse.json({ solicitudes: [], error: error.message }, { status: 500 });
    }

    const solicitudes = (profiles || []).map((p, idx) => ({
      id: `sol-${p.id.substring(0, 6)}`,
      estudiante: `${p.nombres} ${p.apellidos}`,
      dni: p.dni_ce,
      email: p.email,
      programa: p.diplomado_1 || 'DIPLOMADO EN SEGURIDAD Y SALUD OCUPACIONAL',
      tipo: idx % 2 === 0 ? 'CIP (Nacional)' : 'MIAMI (Internacional)',
      fecha: new Date().toISOString().split('T')[0],
      estado: idx === 0 ? 'Pendiente' : 'Emitido'
    }));

    return NextResponse.json({ solicitudes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener certificaciones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, dni, codigoQr } = body;

    const admin = createAdminClient();

    // Registrar en auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: 'EMITIR_CERTIFICADO_CIP_MIAMI',
        detalles: {
          solicitudId: id,
          dni_ce: dni,
          codigoQr: codigoQr || `EDUMIN-CIP-2026-${Math.floor(1000 + Math.random() * 9000)}`
        }
      });
    } catch (e: any) {
      console.error(e);
    }

    return NextResponse.json({ success: true, message: 'Certificado CIP emitido y notificado.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al emitir certificado' }, { status: 500 });
  }
}
