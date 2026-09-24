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

    const nroCuota = body.nro_cuota || body.concepto || `Cuota ${nuevasCuotas}`;

    // 3. Insertar registro en tabla pagos
    try {
      await admin.from("pagos").insert({
        profile_id: student.id,
        dni_ce: student.dni_ce,
        monto,
        metodo,
        comprobante,
        concepto: nroCuota,
        nro_cuota: nroCuota,
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
          comprobante,
          concepto: nroCuota
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
            comprobante,
            concepto: nroCuota
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    // ACCIÓN 1: ANULAR PAGO CON JUSTIFICACIÓN Y NOTIFICAR A N8N
    if (body.action === "anular") {
      const { pago_id, dni_ce, motivo_anulacion } = body;

      if (!motivo_anulacion || !motivo_anulacion.trim()) {
        return NextResponse.json({ error: "Debe ingresar una justificación/motivo obligatorio para anular el pago." }, { status: 400 });
      }

      // 1. Marcar el pago como Anulado en Supabase public.pagos
      let { data: pagoActual, error: errorPago } = await admin
        .from("pagos")
        .update({ 
          estado: "Anulado",
          motivo_anulacion: motivo_anulacion.trim()
        })
        .eq("id", pago_id)
        .select()
        .single();

      if (errorPago) {
        // Fallback si la columna id es numérica o string
        const { data: fallbackPago } = await admin
          .from("pagos")
          .update({ estado: "Anulado" })
          .eq("dni_ce", dni_ce)
          .order("created_at", { ascending: false })
          .limit(1)
          .select()
          .single();
        pagoActual = fallbackPago;
      }

      // 2. Decrementar cuotas_pagadas en profiles si aplica
      const { data: student } = await admin
        .from("profiles")
        .select("id, dni_ce, nombres, apellidos, cuotas_pagadas")
        .eq("dni_ce", dni_ce)
        .maybeSingle();

      if (student && student.cuotas_pagadas > 0) {
        const cuotasDisminuidas = Math.max(0, student.cuotas_pagadas - 1);
        await admin
          .from("profiles")
          .update({ cuotas_pagadas: cuotasDisminuidas })
          .eq("id", student.id);
      }

      // 3. Registrar auditoría forense
      try {
        await admin.from("audit_logs").insert({
          usuario_email: "admin@edumin.pe",
          accion: "ANULACION_PAGO_CON_JUSTIFICACION",
          detalles: {
            pago_id,
            dni_ce,
            estudiante: student ? `${student.nombres} ${student.apellidos}` : dni_ce,
            motivo_anulacion: motivo_anulacion.trim(),
            monto_anulado: pagoActual?.monto || 150.00
          }
        });
      } catch (e) {
        console.error(e);
      }

      // 4. Disparar Webhook n8n notificando la anulación
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
      let webhookDelivered = false;
      if (webhookUrl) {
        try {
          const webhookRes = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              evento: "pago_anulado",
              dni_ce,
              estudiante: student ? `${student.nombres} ${student.apellidos}` : dni_ce,
              pago_id,
              motivo_anulacion: motivo_anulacion.trim(),
              monto_anulado: pagoActual?.monto || 150.00,
              timestamp: new Date().toISOString()
            }),
            cache: "no-store",
            signal: AbortSignal.timeout(10_000)
          });
          webhookDelivered = webhookRes.ok;
        } catch (e) {
          console.error("Error notificando anulación a n8n:", e);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Pago anulado correctamente con justificación y notificado a n8n.",
        webhookDelivered
      });
    }

    // ACCIÓN 2: EDITAR CRONOGRAMA DE CUOTAS Y MÚLTIPLES CRONOGRAMAS EN SUPABASE
    if (body.action === "editar_cronograma") {
      const { student_id, dni_ce, cuotas_totales, monto_cuota, cronogramas } = body;

      const query = student_id ? admin.from("profiles").update({
        cuotas_totales: Number(cuotas_totales) || 3,
        monto_cuota: Number(monto_cuota) || 150.00,
        cronogramas: cronogramas || []
      }).eq("id", student_id) : admin.from("profiles").update({
        cuotas_totales: Number(cuotas_totales) || 3,
        monto_cuota: Number(monto_cuota) || 150.00,
        cronogramas: cronogramas || []
      }).eq("dni_ce", dni_ce);

      const { data: updated, error } = await query.select().single();

      if (error) {
        return NextResponse.json({ error: `Error al actualizar cronograma en BD: ${error.message}` }, { status: 500 });
      }

      // Auditoría
      try {
        await admin.from("audit_logs").insert({
          usuario_email: "admin@edumin.pe",
          accion: "EDITAR_CRONOGRAMA_PAGOS",
          detalles: {
            student_id,
            dni_ce,
            cuotas_totales,
            monto_cuota,
            cronogramas
          }
        });
      } catch (e) {
        console.error(e);
      }

      return NextResponse.json({
        success: true,
        message: "Cronograma de pagos actualizado exitosamente en Supabase.",
        estudiante: updated
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error inesperado" }, { status: 500 });
  }
}
