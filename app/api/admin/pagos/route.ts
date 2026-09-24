import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: pagos, error } = await admin
      .from("pagos")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ pagos: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pagos: pagos || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al obtener pagos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "El cuerpo de la solicitud debe ser JSON válido." }, { status: 400 });
    }

    const dni = typeof body.dni_ce === "string" ? body.dni_ce.trim() : "";
    const monto = Number(body.monto) || 150.00;
    const metodo = body.metodo || "Yape / Plin";
    const comprobante = body.comprobante || `OP-${Math.floor(100000 + Math.random() * 900000)}`;

    if (!dni || dni.length > 30) {
      return NextResponse.json({ error: "El campo dni_ce es obligatorio y debe ser válido." }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Buscar el estudiante en profiles
    const { data: student, error: studentError } = await admin
      .from("profiles")
      .select("id, dni_ce, nombres, apellidos, paquete_adquirido, cuotas_pagadas")
      .eq("dni_ce", dni)
      .maybeSingle();

    if (studentError) {
      return NextResponse.json({ error: `Error al buscar alumno: ${studentError.message}` }, { status: 500 });
    }

    if (!student) {
      return NextResponse.json({ error: "Alumno no encontrado con el DNI proporcionado." }, { status: 404 });
    }

    const nuevasCuotas = (student.cuotas_pagadas || 0) + 1;

    // 2. Actualizar cuotas_pagadas y desbloquear alumno en profiles
    const { data: updatedProfile, error: updateError } = await admin
      .from("profiles")
      .update({ 
        cuotas_pagadas: nuevasCuotas,
        bloqueado: false
      })
      .eq("id", student.id)
      .select("dni_ce, nombres, apellidos, paquete_adquirido, cuotas_pagadas")
      .single();

    if (updateError) {
      return NextResponse.json({ error: `Error al actualizar cuotas: ${updateError.message}` }, { status: 500 });
    }

    // 3. Insertar registro en tabla pagos
    try {
      await admin.from("pagos").insert({
        profile_id: student.id,
        dni_ce: student.dni_ce,
        monto,
        metodo,
        estado: "Completado"
      });
    } catch (err: any) {
      console.error("Error al registrar pago en BD:", err);
    }

    // 4. Registrar evento en audit_logs
    try {
      await admin.from("audit_logs").insert({
        usuario_email: "admin@edumin.pe",
        accion: "CUOTA_VALIDADA_MANUAL",
        detalles: {
          dni_ce: student.dni_ce,
          estudiante: `${student.nombres} ${student.apellidos}`,
          cuotas_pagadas: nuevasCuotas,
          monto,
          metodo,
          comprobante
        }
      });
    } catch (err: any) {
      console.error("Error al registrar audit log:", err);
    }

    // 5. Enviar Webhook a n8n si existe la URL
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    let webhookDelivered = false;

    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evento: "pago_registrado",
            nombre_alumno: `${updatedProfile.nombres} ${updatedProfile.apellidos}`,
            dni_ce: updatedProfile.dni_ce,
            paquete_actual: updatedProfile.paquete_adquirido,
            cuotas_pagadas: updatedProfile.cuotas_pagadas,
            monto,
            comprobante
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });

        webhookDelivered = webhookResponse.ok;
      } catch (webhookError) {
        console.error("No fue posible notificar el pago a n8n:", webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pago registrado y validado correctamente.",
      alumno: updatedProfile,
      webhookStatus: webhookDelivered ? 200 : 500
    });
  } catch (error: any) {
    console.error("Error al registrar el pago:", error);
    return NextResponse.json(
      { error: error.message || "Ocurrió un error interno al registrar el pago." },
      { status: 500 }
    );
  }
}
