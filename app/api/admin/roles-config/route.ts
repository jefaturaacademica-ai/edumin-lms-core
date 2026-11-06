import { NextResponse } from 'next/server';
import { 
  obtenerConfiguracionRoles, 
  guardarConfiguracionRoles 
} from '@/lib/services/rolesService';
import { SIDEBAR_MODULOS_EDUMIN } from '@/lib/types/roles';

export async function GET() {
  try {
    const roles = await obtenerConfiguracionRoles();
    return NextResponse.json({ 
      success: true, 
      roles,
      modulosDisponibles: SIDEBAR_MODULOS_EDUMIN 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { roles } = body;

    if (!roles || typeof roles !== 'object') {
      return NextResponse.json({ success: false, error: 'Formato de roles no válido' }, { status: 400 });
    }

    await guardarConfiguracionRoles(roles);
    return NextResponse.json({ success: true, roles });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
