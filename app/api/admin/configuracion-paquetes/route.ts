import { NextResponse } from 'next/server';
import { 
  obtenerConfiguracionPaquetes, 
  guardarConfiguracionPaquetes,
  type PaqueteDefinicion 
} from '@/lib/services/paquetesService';

let paquetesCache: { paquetes: any; timestamp: number } | null = null;
const PAQUETES_TTL = 5 * 60 * 1000;

export async function GET() {
  try {
    if (paquetesCache && Date.now() - paquetesCache.timestamp < PAQUETES_TTL) {
      return NextResponse.json({ success: true, paquetes: paquetesCache.paquetes }, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'X-Cache': 'HIT'
        }
      });
    }

    const paquetes = await obtenerConfiguracionPaquetes();
    paquetesCache = { paquetes, timestamp: Date.now() };

    return NextResponse.json({ success: true, paquetes }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    paquetesCache = null;
    const body = await req.json();
    const { paquetes } = body;

    if (!paquetes || typeof paquetes !== 'object') {
      return NextResponse.json({ success: false, error: 'Formato de paquetes no válido' }, { status: 400 });
    }

    await guardarConfiguracionPaquetes(paquetes);
    return NextResponse.json({ success: true, paquetes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
