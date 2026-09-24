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

  // Verificar la contraseña proporcionada contra 'contrasena' (si existe) o contra el DNI
  const hasCustomPassword = Boolean(profile.contrasena && profile.contrasena.trim() !== "");
  const isMatchCustom = hasCustomPassword && password === profile.contrasena!.trim();
  const isMatchDni = password === profile.dni_ce;

  if (!isMatchCustom && !isMatchDni) {
    return INVALID_CREDENTIALS;
  }

  // Sincronizar o asegurar la existencia del usuario en auth.users de Supabase
  const userEmail = profile.email || `${profile.dni_ce}@edumin.pe`;
  const { data: authUserData, error: getUserError } = await admin.auth.admin.getUserById(profile.id);

  if (getUserError || !authUserData?.user) {
    // Si no existe el usuario en auth.users con profile.id, lo creamos
    const { error: createError } = await admin.auth.admin.createUser({
      id: profile.id,
      email: userEmail,
      password: password,
      email_confirm: true,
      user_metadata: { dni_ce: profile.dni_ce },
    });

    if (createError) {
      console.error("Error al crear usuario en Supabase Auth:", createError.message);
    }
  } else {
    // Si ya existe el usuario en auth.users, actualizamos su contraseña al password ingresado
    const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
      password: password,
      email: userEmail,
      email_confirm: true,
    });

    if (updateError) {
      console.error("Error al actualizar contraseña en Supabase Auth:", updateError.message);
    }
  }

  // Iniciar sesión con Supabase Auth nativo para escribir las cookies de sesión (HTTP-only)
  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: userEmail,
    password: password,
  });

  if (signInError) {
    console.error("Error en signInWithPassword:", signInError.message);
    return INVALID_CREDENTIALS;
  }

  // Redirección según rol
  if (profile.role === "ADMIN" || profile.role === "SUPERADMIN") {
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
    .update({ debe_cambiar_password: false, contrasena: password })
    .eq("id", user.id);

  if (profileError) {
    return {
      error:
        "Tu contraseña fue actualizada, pero no pudimos habilitar el acceso. Contacta a soporte.",
    };
  }

  redirect("/dashboard");
}
