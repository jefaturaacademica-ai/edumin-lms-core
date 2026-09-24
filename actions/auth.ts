"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
};

export type UpdatePasswordState = {
  error?: string;
};

const INVALID_CREDENTIALS: LoginState = {
  error: "El DNI/Carnet o la contraseña no son válidos.",
};

export async function loginWithDni(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const dni = formData.get("dni")?.toString().trim();
  const password = formData.get("password")?.toString()?.trim();

  if (!dni || !password) {
    return { error: "Ingresa tu DNI/Carnet y contraseña para continuar." };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, email, dni_ce, contrasena, role, bloqueado")
    .eq("dni_ce", dni)
    .maybeSingle();

  if (profileError || !profile) {
    return INVALID_CREDENTIALS;
  }

  if (profile.bloqueado) {
    return { error: "Tu acceso ha sido bloqueado por el sistema. Por favor comunícate con administración." };
  }

  // 1. Intentar primero con Supabase Auth nativo
  const supabase = await createClient();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: profile.email || `${profile.dni_ce}@edumin.pe`,
    password,
  });

  // 2. Si Auth nativo falla o la cuenta está en profiles, verificar contraseña esperada (columna 'contrasena' o DNI por defecto)
  if (authError) {
    const passwordEsperada = (profile.contrasena && profile.contrasena.trim() !== "")
      ? profile.contrasena.trim()
      : profile.dni_ce;

    if (password !== passwordEsperada) {
      return INVALID_CREDENTIALS;
    }
  }

  // 3. Redirección según rol
  if (profile.role === "ADMIN") {
    redirect("/admin");
  }

  redirect("/dashboard");
}

export async function updatePassword(
  _previousState: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = formData.get("password")?.toString();
  const confirmPassword = formData.get("confirmPassword")?.toString();

  if (!password || password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password !== confirmPassword) {
    return { error: "Las contraseñas no coinciden." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password });
  if (passwordError) {
    return { error: "No fue posible actualizar tu contraseña. Inténtalo otra vez." };
  }

  const admin = createAdminClient();
  const { error: profileError } = await admin
    .from("profiles")
    .update({ debe_cambiar_password: false })
    .eq("id", user.id);

  if (profileError) {
    return {
      error:
        "Tu contraseña fue actualizada, pero no pudimos habilitar el acceso. Contacta a soporte.",
    };
  }

  redirect("/dashboard");
}
