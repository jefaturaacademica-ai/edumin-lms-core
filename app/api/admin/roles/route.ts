import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    
    // Obtener usuarios de profiles
    const { data: usuarios, error } = await admin
      .from('profiles')
      .select('id, dni_ce, nombres, apellidos, email, role, paquete_adquirido')
      .order('nombres', { ascending: true });

    if (error) {
      return NextResponse.json({ usuarios: [], error: error.message }, { status: 500 });
    }

    // Obtener asignaciones detalladas de audit_logs más recientes
    const { data: assignmentsLogs } = await admin
      .from('audit_logs')
      .select('detalles')
      .eq('accion', 'ASIGNACION_ROLES_RBAC')
      .order('created_at', { ascending: false })
      .limit(200);

    const assignmentsMap = new Map<string, { rolAdministrativo: string | null; rolAcademico: string | null }>();
    if (assignmentsLogs) {
      for (const log of assignmentsLogs) {
        if (log.detalles?.userId && !assignmentsMap.has(log.detalles.userId)) {
          assignmentsMap.set(log.detalles.userId, {
            rolAdministrativo: log.detalles.rolAdministrativo ?? null,
            rolAcademico: log.detalles.rolAcademico ?? null,
          });
        }
      }
    }

    const formatted = (usuarios || []).map((u) => {
      const explicit = assignmentsMap.get(u.id);

      // Determinar Rol Administrativo (máximo 1)
      let rolAdministrativo: string | null = null;
      if (explicit && explicit.rolAdministrativo !== undefined) {
        rolAdministrativo = explicit.rolAdministrativo;
      } else {
        if (u.role === 'SUPERADMIN') rolAdministrativo = 'SUPERADMIN';
        else if (u.role === 'ADMIN') rolAdministrativo = 'ADMIN';
        else rolAdministrativo = null;
      }

      // Determinar Rol Académico (máximo 1)
      let rolAcademico: string | null = null;
      if (explicit && explicit.rolAcademico !== undefined) {
        rolAcademico = explicit.rolAcademico;
      } else {
        if (u.role === 'DOCENTE') rolAcademico = 'DOCENTE';
        else if (u.role === 'ESTUDIANTE' || u.paquete_adquirido) rolAcademico = 'ESTUDIANTE';
        else rolAcademico = null; // Usuario puramente administrativo sin rol de alumno
      }

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

    // Determinar valor para la columna enum de Supabase (profiles.role)
    let dbRole = 'ESTUDIANTE';
    if (targetAdminRole === 'SUPERADMIN') {
      dbRole = 'SUPERADMIN';
    } else if (targetAdminRole) {
      dbRole = 'ADMIN'; // Administrador o roles administrativos personalizados
    } else if (targetAcadRole === 'DOCENTE') {
      dbRole = 'DOCENTE';
    } else {
      dbRole = 'ESTUDIANTE';
    }

    const { data: updatedUser, error } = await admin
      .from('profiles')
      .update({ role: dbRole })
      .eq('id', userId)
      .select('id, dni_ce, nombres, apellidos, email, role')
      .single();

    if (error) {
      return NextResponse.json({ error: `Error al actualizar perfil en base de datos: ${error.message}` }, { status: 500 });
    }

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
          dbRole: updatedUser.role,
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
        rolAdministrativo: targetAdminRole || null,
        rolAcademico: targetAcadRole || null
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
