import { NextResponse } from 'next/server';
import { getMasterApiKey } from '@/lib/auth/apiKeyValidator';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rawKey = getMasterApiKey();
    
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
