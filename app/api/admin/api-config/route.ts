import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawKey = process.env.EDUMIN_API_KEY || process.env.N8N_API_SECRET_KEY || '';
    
    // Devolvemos la clave real para que el administrador autenticado pueda verla o copiarla
    return NextResponse.json({
      success: true,
      apiKey: rawKey,
      entorno: process.env.NODE_ENV || 'production',
      servidor: 'https://edumin-lms-core.vercel.app',
      version: 'v1.0.0',
      totalEndpoints: 5
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
