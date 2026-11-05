import { NextResponse } from 'next/server';
import { 
  obtenerConfiguracionBienvenida, 
  guardarConfiguracionBienvenida 
} from '@/lib/services/bienvenidaService';

export async function GET() {
  try {
    const config = await obtenerConfiguracionBienvenida();
    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mensajePlantilla, imagenFondo } = body;

    const nuevaConfig = {
      mensajePlantilla: (mensajePlantilla || '').trim() || '¡Hola, {nombre}, bienvenido a tu portal de especialización ejecutiva!',
      imagenFondo: (imagenFondo || '').trim() || 'https://img.magnific.com/foto-gratis/retrato-ingenieros-horas-trabajo-sitio-trabajo_23-2151589536.jpg?semt=ais_hybrid&w=740&q=80'
    };

    await guardarConfiguracionBienvenida(nuevaConfig);
    return NextResponse.json({ success: true, config: nuevaConfig });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
