import { NextResponse } from 'next/server';
import { 
  obtenerConfiguracionLogin, 
  guardarConfiguracionLogin,
  type LoginBannerConfig 
} from '@/lib/services/loginBannerService';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const config = await obtenerConfiguracionLogin();
    return NextResponse.json({ success: true, config });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Validar usuario autenticado
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { modo, tituloCampana, htmlPersonalizado } = body;

    if (!modo || !['contactos', 'html', 'vacio'].includes(modo)) {
      return NextResponse.json({ error: 'Modo de visualización no válido' }, { status: 400 });
    }

    const nuevaConfig: LoginBannerConfig = {
      modo,
      tituloCampana: (tituloCampana || '').trim(),
      htmlPersonalizado: typeof htmlPersonalizado === 'string' ? htmlPersonalizado : ''
    };

    await guardarConfiguracionLogin(nuevaConfig);

    return NextResponse.json({ success: true, config: nuevaConfig });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
