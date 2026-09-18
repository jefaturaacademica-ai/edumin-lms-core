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
  const password = formData.get("password")?.toString();

  if (!dni || !password) {
    return { error: "Ingresa tu DNI/Carnet y contraseña para continuar." };
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("email")
    .eq("dni_ce", dni)
    .maybeSingle();

  // La respuesta es deliberadamente genérica para no enumerar cuentas por DNI.
  if (profileError || !profile?.email) {
    return INVALID_CREDENTIALS;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  });

  if (error) {
    return INVALID_CREDENTIALS;
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
