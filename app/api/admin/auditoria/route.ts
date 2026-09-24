import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    
    const { data: logs, error } = await admin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ logs: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener logs de auditoría' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accion, detalles, usuario_email } = body;

    if (!accion) {
      return NextResponse.json({ error: 'Acción es requerida' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: logData, error } = await admin
      .from('audit_logs')
      .insert({
        usuario_email: usuario_email || 'admin@edumin.pe',
        accion: accion.toUpperCase(),
        detalles: detalles || {}
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Error al guardar log: ${error.message}` }, { status: 500 });
    }

    // Probar Webhook n8n
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    let webhookDelivered = false;

    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            evento: accion,
            detalles,
            timestamp: new Date().toISOString()
          }),
          cache: 'no-store',
          signal: AbortSignal.timeout(10_000),
        });

        webhookDelivered = webhookResponse.ok;
      } catch (err) {
        console.error('Error enviando ping n8n:', err);
      }
    }

    return NextResponse.json({
      success: true,
      log: logData,
      webhook: { delivered: webhookDelivered, configured: Boolean(webhookUrl) }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
