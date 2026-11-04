import { NextResponse } from 'next/server';
import { 
  obtenerConfiguracionPaquetes, 
  guardarConfiguracionPaquetes,
  type PaqueteDefinicion 
} from '@/lib/services/paquetesService';

export async function GET() {
  try {
    const paquetes = await obtenerConfiguracionPaquetes();
    return NextResponse.json({ success: true, paquetes });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
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
