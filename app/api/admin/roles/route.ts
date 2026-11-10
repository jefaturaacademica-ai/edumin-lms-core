import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPrimaryRoleFromProfile } from '@/lib/utils/profileParser';

export async function GET() {
  try {
    const admin = createAdminClient();
    
    // Obtener usuarios de profiles (roles duales directamente en profiles.roles)
    const { data: usuarios, error } = await admin
      .from('profiles')
      .select('id, dni_ce, nombres, apellidos, email, roles, paquete_adquirido')
      .order('nombres', { ascending: true });

    if (error) {
      return NextResponse.json({ usuarios: [], error: error.message }, { status: 500 });
    }

    const formatted = (usuarios || []).map((u: any) => {
      const rolesObj = (u.roles && typeof u.roles === 'object') ? u.roles : null;

      // Determinar Rol Administrativo (máximo 1)
      const rolAdministrativo: string | null = rolesObj?.administrativo || null;

      // Determinar Rol Académico (máximo 1)
      const rolAcademico: string | null =
        rolesObj && rolesObj.academico !== undefined
          ? (rolesObj.academico || null)
          : (u.paquete_adquirido ? 'ESTUDIANTE' : null);

      // Lista limpia de nombres de roles activos para visualización
      const rolesActivos: string[] = [];
      if (rolAdministrativo) {
        rolesActivos.push(
          rolAdministrativo === 'SUPERADMIN' 
            ? 'Superadministrador' 
            : rolAdministrativo === 'ADMIN' 
            ? 'Administrador' 
            : rolAdministrativo === 'FINANCIERO'
            ? 'Financiero'
            : rolAdministrativo
        );
      }
      if (rolAcademico) {
        rolesActivos.push(rolAcademico === 'DOCENTE' ? 'Docente' : 'Estudiante');
      }

      return {
        ...u,
        role: getPrimaryRoleFromProfile(u),
        rolAdministrativo,
        rolAcademico,
        rolesActivos,
        esDual: Boolean(rolAdministrativo && rolAcademico)
      };
    });

    return NextResponse.json({ usuarios: formatted });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener usuarios y roles' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, role, rolAdministrativo, rolAcademico } = body;

    if (!userId) {
      return NextResponse.json({ error: 'ID de usuario no proporcionado' }, { status: 400 });
    }

    const admin = createAdminClient();

    let targetAdminRole = rolAdministrativo;
    let targetAcadRole = rolAcademico;

    // Soporte retrocompatible si solo envían "role"
    if (role && targetAdminRole === undefined && targetAcadRole === undefined) {
      if (role === 'SUPERADMIN' || role === 'ADMIN') {
        targetAdminRole = role;
        targetAcadRole = 'ESTUDIANTE';
      } else if (role === 'DOCENTE') {
        targetAdminRole = null;
        targetAcadRole = 'DOCENTE';
      } else {
        targetAdminRole = null;
        targetAcadRole = 'ESTUDIANTE';
      }
    }

    // Regla de negocio: Debe tener al menos 1 rol (o administrativo o académico)
    if (!targetAdminRole && !targetAcadRole) {
      return NextResponse.json({ error: 'El usuario debe tener al menos un rol asignado (administrativo o académico).' }, { status: 400 });
    }

    const rolesPayload = {
      administrativo: targetAdminRole || null,
      academico: targetAcadRole || null,
    };

    const { data: updatedUser, error } = await admin
      .from('profiles')
      .update({
        roles: rolesPayload,
      })
      .eq('id', userId)
      .select('id, dni_ce, nombres, apellidos, email, roles')
      .single();

    if (error) {
      return NextResponse.json({ error: `Error al actualizar perfil en base de datos: ${error.message}` }, { status: 500 });
    }

    const resolvedRole = getPrimaryRoleFromProfile(updatedUser);

    // Auditoría y persistencia de asignación exacta (1 rol administrativo + 1 rol académico)
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: 'ASIGNACION_ROLES_RBAC',
        detalles: {
          userId,
          targetEmail: updatedUser.email,
          rolAdministrativo: targetAdminRole || null,
          rolAcademico: targetAcadRole || null,
          dbRole: resolvedRole,
          updated_at: new Date().toISOString()
        }
      });
    } catch (e: any) {
      console.error('Error registrando auditoría de roles:', e);
    }

    return NextResponse.json({ 
      success: true, 
      usuario: {
        ...updatedUser,
        role: resolvedRole,
        rolAdministrativo: targetAdminRole || null,
        rolAcademico: targetAcadRole || null
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
