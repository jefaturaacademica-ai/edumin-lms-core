"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { AVAILABLE_COURSES } from "@/lib/data/courses";
import { createClient } from "@/lib/supabase/server";
import { calculateReleasedCredits } from "@/lib/utils/credits";

export type MatriculaResult = {
  success: boolean;
  message: string;
  webhookDelivered?: boolean;
};

const MAX_UPDATE_ATTEMPTS = 3;

export async function matricularCurso(
  cursoId: string,
  nombreCurso: string,
): Promise<MatriculaResult> {
  const course = AVAILABLE_COURSES.find(
    (availableCourse) =>
      availableCourse.id === cursoId && availableCourse.name === nombreCurso,
  );

  if (!course) {
    return { success: false, message: "El curso seleccionado no es válido." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, message: "Tu sesión ha expirado. Ingresa nuevamente." };
    }

    const admin = createAdminClient();
    let enrolledStudent:
      | {
          dni_ce: string;
          nombres: string;
          paquete_adquirido: string;
          cuotas_pagadas: number;
          cupos_diplomados: number;
        }
      | null = null;

    // Cada reintento vuelve a calcular los créditos con el estado más reciente
    // para evitar consumir más cupos de los liberados en solicitudes paralelas.
    for (let attempt = 0; attempt < MAX_UPDATE_ATTEMPTS; attempt += 1) {
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("id, role, dni_ce, nombres, paquete_adquirido, cuotas_pagadas, cupos_diplomados")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profile) {
        return { success: false, message: "No fue posible obtener tu perfil." };
      }

      if (profile.role !== "ESTUDIANTE") {
        return { success: false, message: "Sólo los estudiantes pueden realizar matrículas." };
      }

      const releasedCredits = calculateReleasedCredits(
        profile.paquete_adquirido,
        profile.cuotas_pagadas,
      );

      if (releasedCredits - profile.cupos_diplomados <= 0) {
        return {
          success: false,
          message: "No tienes créditos disponibles. Registra una nueva cuota para continuar.",
        };
      }

      const { data: updatedProfile, error: updateError } = await admin
        .from("profiles")
        .update({ cupos_diplomados: profile.cupos_diplomados + 1 })
        .eq("id", profile.id)
        .eq("cupos_diplomados", profile.cupos_diplomados)
        .select("dni_ce, nombres, paquete_adquirido, cuotas_pagadas, cupos_diplomados")
        .maybeSingle();

      if (updateError) {
        throw new Error("No fue posible actualizar los cupos del estudiante.");
      }

      if (updatedProfile) {
        enrolledStudent = updatedProfile;
        break;
      }
    }

    if (!enrolledStudent) {
      return {
        success: false,
        message: "No pudimos confirmar tu matrícula. Inténtalo nuevamente.",
      };
    }

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_Q10_WEBHOOK_URL;
    let webhookDelivered = false;

    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evento: "curso_matriculado",
            alumno: {
              nombre: enrolledStudent.nombres,
              dni_ce: enrolledStudent.dni_ce,
              paquete: enrolledStudent.paquete_adquirido,
              cuotas_pagadas: enrolledStudent.cuotas_pagadas,
              cupos_diplomados: enrolledStudent.cupos_diplomados,
            },
            curso: { id: course.id, nombre: course.name },
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });
        webhookDelivered = webhookResponse.ok;
      } catch (webhookError) {
        console.error("No fue posible notificar la matrícula a n8n.", webhookError);
      }
    }

    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Tu matrícula en ${course.name} fue registrada correctamente.`,
      webhookDelivered,
    };
  } catch (error) {
    console.error("Error al matricular al estudiante.", error);
    return {
      success: false,
      message: "Ocurrió un error inesperado al procesar tu matrícula.",
    };
  }
}
