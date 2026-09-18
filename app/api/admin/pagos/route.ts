import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type PaymentRequest = {
  dni_ce?: unknown;
};

const MAX_UPDATE_ATTEMPTS = 3;

function isAdministrator(role: unknown): role is "ADMIN" | "SUPERADMIN" {
  return role === "ADMIN" || role === "SUPERADMIN";
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "No autenticado." }, { status: 401 });
    }

    const { data: operatorProfile, error: operatorError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (operatorError || !isAdministrator(operatorProfile?.role)) {
      return NextResponse.json({ error: "No tienes permisos para registrar pagos." }, { status: 403 });
    }

    let body: PaymentRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, { status: 400 });
    }

    const dni = typeof body.dni_ce === "string" ? body.dni_ce.trim() : "";
    if (!dni || dni.length > 30) {
      return NextResponse.json({ error: "El campo dni_ce es obligatorio y no es válido." }, { status: 400 });
    }

    const admin = createAdminClient();
    let updatedStudent:
      | { dni_ce: string; nombres: string; paquete_adquirido: string; cuotas_pagadas: number }
      | null = null;

    // La condición sobre cuotas_pagadas evita que dos pagos simultáneos se
    // sobrescriban. Si otra petición gana la carrera, se vuelve a leer y reintenta.
    for (let attempt = 0; attempt < MAX_UPDATE_ATTEMPTS; attempt += 1) {
      const { data: student, error: studentError } = await admin
        .from("profiles")
        .select("id, dni_ce, nombres, paquete_adquirido, cuotas_pagadas")
        .eq("dni_ce", dni)
        .maybeSingle();

      if (studentError) {
        throw new Error("No fue posible consultar el perfil del alumno.");
      }

      if (!student) {
        return NextResponse.json({ error: "Alumno no encontrado." }, { status: 404 });
      }

      const { data: updatedProfile, error: updateError } = await admin
        .from("profiles")
        .update({ cuotas_pagadas: student.cuotas_pagadas + 1 })
        .eq("id", student.id)
        .eq("cuotas_pagadas", student.cuotas_pagadas)
        .select("dni_ce, nombres, paquete_adquirido, cuotas_pagadas")
        .maybeSingle();

      if (updateError) {
        throw new Error("No fue posible registrar el pago.");
      }

      if (updatedProfile) {
        updatedStudent = updatedProfile;
        break;
      }
    }

    if (!updatedStudent) {
      return NextResponse.json(
        { error: "El pago no pudo registrarse por concurrencia. Inténtalo nuevamente." },
        { status: 409 },
      );
    }

    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    let webhookDelivered = false;

    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evento: "pago_registrado",
            nombre_alumno: updatedStudent.nombres,
            dni_ce: updatedStudent.dni_ce,
            paquete_actual: updatedStudent.paquete_adquirido,
            cuotas_pagadas: updatedStudent.cuotas_pagadas,
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });

        webhookDelivered = webhookResponse.ok;
      } catch (webhookError) {
        console.error("No fue posible notificar el pago a n8n.", webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pago registrado correctamente.",
      alumno: updatedStudent,
      webhook: {
        delivered: webhookDelivered,
        configured: Boolean(webhookUrl),
      },
    });
  } catch (error) {
    console.error("Error al registrar el pago.", error);
    return NextResponse.json(
      { error: "Ocurrió un error interno al registrar el pago." },
      { status: 500 },
    );
  }
}
