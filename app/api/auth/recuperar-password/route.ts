import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

// Registro en memoria de intentos fallidos para prevenir fuerza bruta por IP (máx 5 intentos / 10 min)
const failedAttempts = new Map<string, { count: number; firstAttempt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record) return false;

  // Ventana de 10 minutos
  if (now - record.firstAttempt > 10 * 60 * 1000) {
    failedAttempts.delete(ip);
    return false;
  }

  return record.count >= 5;
}

function registerFailedAttempt(ip: string) {
  const now = Date.now();
  const record = failedAttempts.get(ip);
  if (!record || now - record.firstAttempt > 10 * 60 * 1000) {
    failedAttempts.set(ip, { count: 1, firstAttempt: now });
  } else {
    record.count += 1;
  }
}

function resetFailedAttempts(ip: string) {
  failedAttempts.delete(ip);
}

// Generar y verificar token de restablecimiento firmado con HMAC (válido 15 minutos)
function getSecretKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || 'edumin-lms-password-recovery-secret-2026';
}

function generateResetToken(userId: string): string {
  const timestamp = Date.now().toString();
  const data = `${userId}:${timestamp}`;
  const hmac = crypto.createHmac('sha256', getSecretKey()).update(data).digest('hex');
  return `${userId}.${timestamp}.${hmac}`;
}

function verifyResetToken(token: string): { valid: boolean; userId?: string; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token de restablecimiento inválido.' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Formato de token no válido.' };
  }

  const [userId, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) {
    return { valid: false, error: 'Token corrupto o inválido.' };
  }

  // Comprobar expiración (15 minutos)
  const now = Date.now();
  if (now - timestamp > 15 * 60 * 1000) {
    return { valid: false, error: 'El enlace o sesión de restablecimiento ha expirado. Por favor inicia el proceso nuevamente.' };
  }

  // Verificar firma HMAC
  const expectedHmac = crypto.createHmac('sha256', getSecretKey()).update(`${userId}:${timestampStr}`).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedHmac, 'hex'))) {
    return { valid: false, error: 'Firma de seguridad no válida.' };
  }

  return { valid: true, userId };
}

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown-ip';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: 'Has alcanzado el límite de intentos. Por favor espera 10 minutos antes de volver a intentar.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { accion } = body;

    const admin = createAdminClient();

    // -------------------------------------------------------------
    // FASE 1: Verificar identidad (Usuario + Correo electrónico)
    // -------------------------------------------------------------
    if (accion === 'verificar') {
      const usuario = body.usuario?.toString().trim();
      const email = body.email?.toString().trim().toLowerCase();

      if (!usuario || !email) {
        return NextResponse.json(
          { success: false, error: 'Ingresa tu usuario y correo electrónico registrado.' },
          { status: 400 }
        );
      }

      // Buscar perfil por número de documento (usuario) o por correo electrónico
      let { data: profile } = await admin
        .from('profiles')
        .select('id, numero_documento, email, nombres, apellidos, bloqueado')
        .eq('numero_documento', usuario)
        .maybeSingle();

      if (!profile) {
        // Fallback por si el usuario ingresó su correo en el campo usuario
        const { data: profileByEmail } = await admin
          .from('profiles')
          .select('id, numero_documento, email, nombres, apellidos, bloqueado')
          .ilike('email', usuario)
          .maybeSingle();

        if (profileByEmail) {
          profile = profileByEmail;
        }
      }

      if (!profile) {
        registerFailedAttempt(ip);
        return NextResponse.json(
          { success: false, error: 'No se encontró ninguna cuenta asociada a este usuario.' },
          { status: 404 }
        );
      }

      if (profile.bloqueado) {
        return NextResponse.json(
          { success: false, error: 'Tu cuenta ha sido bloqueada. Por favor comunícate con administración.' },
          { status: 403 }
        );
      }

      // Validar coincidencia con el correo registrado
      const profileEmail = profile.email?.trim().toLowerCase();
      const coincideCorreo = profileEmail && (profileEmail === email || profileEmail === usuario.toLowerCase());
      const coincideDoc = profile.numero_documento === usuario || profile.numero_documento === email;

      if (!coincideCorreo && !coincideDoc) {
        registerFailedAttempt(ip);
        return NextResponse.json(
          { success: false, error: 'El correo electrónico ingresado no coincide con el registrado en tu cuenta.' },
          { status: 400 }
        );
      }

      // Identidad verificada con éxito
      resetFailedAttempts(ip);
      const resetToken = generateResetToken(profile.id);
      const primerNombre = profile.nombres ? profile.nombres.trim().split(/\s+/)[0] : 'Estudiante';

      return NextResponse.json({
        success: true,
        token: resetToken,
        nombre: primerNombre,
        message: 'Identidad confirmada exitosamente.',
      });
    }

    // -------------------------------------------------------------
    // FASE 2: Restablecer contraseña con el token seguro
    // -------------------------------------------------------------
    if (accion === 'restablecer') {
      const { token, password } = body;

      if (!password || typeof password !== 'string' || password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' },
          { status: 400 }
        );
      }

      const tokenVerification = verifyResetToken(token);
      if (!tokenVerification.valid || !tokenVerification.userId) {
        return NextResponse.json(
          { success: false, error: tokenVerification.error || 'Token inválido o expirado.' },
          { status: 400 }
        );
      }

      const userId = tokenVerification.userId;

      // Obtener datos del perfil para sincronización
      const { data: profile, error: getErr } = await admin
        .from('profiles')
        .select('id, email, numero_documento')
        .eq('id', userId)
        .maybeSingle();

      if (getErr || !profile) {
        return NextResponse.json(
          { success: false, error: 'No se encontró el usuario en la base de datos.' },
          { status: 404 }
        );
      }

      // 1. Sincronizar / actualizar en Supabase Auth
      const userEmail = profile.email || `${profile.numero_documento}@edumin.pe`;
      const { error: authUpdateErr } = await admin.auth.admin.updateUserById(userId, {
        password: password,
        email: userEmail,
        email_confirm: true,
      });

      if (authUpdateErr) {
        console.warn('Error al actualizar contraseña en auth.users, intentando crear usuario:', authUpdateErr.message);
        // Si no existía en auth.users, lo creamos
        await admin.auth.admin.createUser({
          id: userId,
          email: userEmail,
          password: password,
          email_confirm: true,
          user_metadata: { numero_documento: profile.numero_documento },
        });
      }

      // 2. Actualizar en tabla profiles
      const { error: profUpdateErr } = await admin
        .from('profiles')
        .update({
          contrasena: password,
          debe_cambiar_password: false,
        })
        .eq('id', userId);

      if (profUpdateErr) {
        console.error('Error al actualizar perfil en profiles:', profUpdateErr);
        return NextResponse.json(
          { success: false, error: 'No se pudo actualizar la contraseña en tu perfil.' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: '¡Tu contraseña ha sido restablecida con éxito! Ya puedes iniciar sesión con tu nueva contraseña.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Acción no válida.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error inesperado en /api/auth/recuperar-password:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno del servidor.' },
      { status: 500 }
    );
  }
}
