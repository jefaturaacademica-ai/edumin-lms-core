import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function parseCreditoRow(pag: any, auditLogs: any[]) {
  if (typeof pag.metodo === 'string' && pag.metodo.startsWith('CARGO_EXTRA|')) {
    const concepto = pag.metodo.replace('CARGO_EXTRA|', '');
    return {
      id: pag.id,
      profile_id: pag.profile_id,
      dni_ce: pag.dni_ce,
      is_cargo_extra: true,
      concepto,
      nro_cuota: `Cargo Extra (${concepto})`,
      num_credito: 99,
      monto: Number(pag.monto || 0),
      metodo: 'Yape / Plin',
      estado: pag.estado || 'APROBADO',
      created_at: pag.created_at,
      cuotas: [],
      total_pagado: Number(pag.monto || 0),
      total_deuda: 0
    };
  }

  let num_credito = pag.num_credito || 1;
  let cuotas = [
    pag.cuota_01 || pag['cuota 01'] || '0',
    pag.cuota_02 || pag['cuota 02'] || 'no corresponde',
    pag.cuota_03 || pag['cuota 03'] || 'no corresponde',
    pag.cuota_04 || pag['cuota 04'] || 'no corresponde',
    pag.cuota_05 || pag['cuota 05'] || 'no corresponde',
    pag.cuota_06 || pag['cuota 06'] || 'no corresponde'
  ];
  let total_pagado = Number(pag.total_pagado || pag['total pagado'] || 0);
  let total_deuda = Number(pag.total_deuda || pag['total deuda'] || pag.monto || 0);
  let parsedFromMetodo = false;

  if (typeof pag.metodo === 'string' && pag.metodo.startsWith('CREDITO_')) {
    try {
      const jsonStr = pag.metodo.substring(pag.metodo.indexOf('|') + 1);
      const parsed = JSON.parse(jsonStr);
      num_credito = parsed.num_credito || num_credito;
      if (Array.isArray(parsed.cuotas)) {
        cuotas = parsed.cuotas;
        parsedFromMetodo = true;
      }
      total_pagado = parsed.total_pagado ?? total_pagado;
      total_deuda = parsed.total_deuda ?? Math.max(0, Number(pag.monto || 0) - total_pagado);
    } catch {
      // ignore
    }
  }

  if (!parsedFromMetodo) {
    const auditEntry = (auditLogs || []).find((a: any) => a.detalles?.pago_id === pag.id);
    if (auditEntry?.detalles) {
      num_credito = auditEntry.detalles.num_credito || num_credito;
      cuotas = auditEntry.detalles.cuotas || cuotas;
      total_pagado = auditEntry.detalles.total_pagado ?? total_pagado;
      total_deuda = auditEntry.detalles.total_deuda ?? total_deuda;
    }
  }

  if (Array.isArray(cuotas)) {
    total_pagado = cuotas.reduce((sum: number, val: string) => {
      return val !== 'no corresponde' ? sum + (Number(val) || 0) : sum;
    }, 0);
    total_deuda = Math.max(0, Number(pag.monto || 0) - total_pagado);
  }

  return {
    id: pag.id,
    profile_id: pag.profile_id,
    dni_ce: pag.dni_ce,
    num_credito,
    monto: Number(pag.monto || 0),
    metodo: pag.metodo && !pag.metodo.startsWith('CREDITO_') ? pag.metodo : 'Por Pagar',
    estado: pag.estado || 'Pendiente',
    created_at: pag.created_at,
    cuotas,
    'cuota 01': cuotas[0],
    'cuota 02': cuotas[1],
    'cuota 03': cuotas[2],
    'cuota 04': cuotas[3],
    'cuota 05': cuotas[4],
    'cuota 06': cuotas[5],
    cuota_01: cuotas[0],
    cuota_02: cuotas[1],
    cuota_03: cuotas[2],
    cuota_04: cuotas[3],
    cuota_05: cuotas[4],
    cuota_06: cuotas[5],
    total_pagado,
    total_deuda,
    'total pagado': total_pagado,
    'total deuda': total_deuda
  };
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data: pagos, error } = await admin
      .from("pagos")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ pagos: [], error: error.message }, { status: 500 });
    }

    const { data: auditLogs } = await admin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    const creditosFmt = (pagos || []).map((p: any) => parseCreditoRow(p, auditLogs || []));

    return NextResponse.json({ pagos: creditosFmt });
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
    const montoPago = Number(body.monto) || 150.00;
    const metodo = body.metodo || "Yape / Plin";
    const comprobante = body.comprobante || `OP-${Math.floor(100000 + Math.random() * 900000)}`;
    const pagoId = body.pago_id || null;
    const numCredito = Number(body.num_credito) || 1;
    const cuotaIndex = body.cuota_index !== undefined ? Number(body.cuota_index) : null;
    const isCargoExtra = Boolean(body.is_cargo_extra || body.concepto);
    const conceptoCargo = body.concepto || "Examen Sustitutorio";

    if (!dni || dni.length > 30) {
      return NextResponse.json({ error: "El campo dni_ce es obligatorio y debe ser válido." }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Buscar estudiante en profiles
    const { data: student, error: studentError } = await admin
      .from("profiles")
      .select("id, dni_ce, nombres, apellidos, paquete_adquirido, cuotas_pagadas")
      .eq("dni_ce", dni)
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json({ error: "Alumno no encontrado con el DNI proporcionado." }, { status: 404 });
    }

    // CASO ESPECIAL: REGISTRAR CARGO EXTRA (Examen sustitutorio, mora, etc.)
    if (isCargoExtra) {
      const { data: newCargo, error: cargoErr } = await admin.from("pagos").insert({
        profile_id: student.id,
        dni_ce: student.dni_ce,
        monto: montoPago,
        metodo: `CARGO_EXTRA|${conceptoCargo}`,
        estado: "APROBADO"
      }).select().single();

      if (cargoErr) {
        return NextResponse.json({ error: `Error al insertar cargo extra: ${cargoErr.message}` }, { status: 500 });
      }

      try {
        await admin.from("audit_logs").insert({
          usuario_email: "admin@edumin.pe",
          accion: "CARGO_EXTRA_REGISTRADO",
          detalles: {
            pago_id: newCargo.id,
            dni_ce: student.dni_ce,
            estudiante: `${student.nombres} ${student.apellidos}`,
            concepto: conceptoCargo,
            monto: montoPago,
            metodo,
            comprobante
          }
        });
      } catch (e) {
        console.error(e);
      }

      // Webhook n8n
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
      let webhookDelivered = false;
      if (webhookUrl) {
        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              evento: "cargo_extra_registrado",
              nombre_alumno: `${student.nombres} ${student.apellidos}`,
              dni_ce: student.dni_ce,
              concepto: conceptoCargo,
              monto: montoPago,
              comprobante
            }),
            cache: "no-store",
            signal: AbortSignal.timeout(10_000)
          });
          webhookDelivered = res.ok;
        } catch (e) {
          console.error(e);
        }
      }

      return NextResponse.json({
        success: true,
        message: `¡Cargo extra "${conceptoCargo}" por S/ ${montoPago.toFixed(2)} registrado exitosamente en Supabase!`,
        cargo: newCargo,
        webhookStatus: webhookDelivered ? 200 : 500
      });
    }

    // 2. Buscar crédito objetivo
    const { data: creditosExistentes } = await admin
      .from("pagos")
      .select("*")
      .eq("dni_ce", dni)
      .order("created_at", { ascending: true });

    const { data: auditLogs } = await admin
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    let targetCreditRow = (creditosExistentes || []).find((c: any) => c.id === pagoId);
    if (!targetCreditRow) {
      const parsedCreds = (creditosExistentes || []).map((c: any) => parseCreditoRow(c, auditLogs || []));
      const matchNum = parsedCreds.find((c: any) => c.num_credito === numCredito && !c.is_cargo_extra);
      if (matchNum) {
        targetCreditRow = creditosExistentes?.find((c: any) => c.id === matchNum.id);
      }
    }

    if (!targetCreditRow && creditosExistentes && creditosExistentes.length > 0) {
      targetCreditRow = creditosExistentes.find((c: any) => !String(c.metodo).startsWith('CARGO_EXTRA|')) || creditosExistentes[0];
    }

    let parsedCredito = targetCreditRow ? parseCreditoRow(targetCreditRow, auditLogs || []) : null;

    if (!parsedCredito || parsedCredito.is_cargo_extra) {
      const metadataMetodo = `CREDITO_1|${JSON.stringify({
        num_credito: 1,
        cuotas: [String(montoPago), 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'],
        total_pagado: montoPago,
        total_deuda: 0
      })}`;

      const { data: newPago } = await admin.from("pagos").insert({
        profile_id: student.id,
        dni_ce: student.dni_ce,
        monto: montoPago,
        metodo: metadataMetodo,
        estado: "Pendiente"
      }).select().single();

      targetCreditRow = newPago;
      parsedCredito = parseCreditoRow(newPago, auditLogs || []);
    } else {
      const updatedCuotas = [...parsedCredito.cuotas];
      
      let targetIdx = cuotaIndex;
      if (targetIdx === null || targetIdx < 0 || targetIdx > 5) {
        targetIdx = updatedCuotas.findIndex((val: string) => val !== 'no corresponde' && Number(val) === 0);
        if (targetIdx === -1) {
          targetIdx = 0;
        }
      }

      updatedCuotas[targetIdx] = String(montoPago);

      const newTotalPagado = updatedCuotas.reduce((sum: number, val: string) => {
        return val !== 'no corresponde' ? sum + (Number(val) || 0) : sum;
      }, 0);

      const newTotalDeuda = Math.max(0, parsedCredito.monto - newTotalPagado);

      const metadataMetodo = `CREDITO_${parsedCredito.num_credito}|${JSON.stringify({
        num_credito: parsedCredito.num_credito,
        cuotas: updatedCuotas,
        total_pagado: newTotalPagado,
        total_deuda: newTotalDeuda
      })}`;

      await admin.from("pagos").update({
        metodo: metadataMetodo,
        estado: newTotalDeuda === 0 ? "Completado" : "Pendiente"
      }).eq("id", parsedCredito.id);

      parsedCredito.cuotas = updatedCuotas;
      parsedCredito.total_pagado = newTotalPagado;
      parsedCredito.total_deuda = newTotalDeuda;
    }

    // Auditoría
    try {
      await admin.from("audit_logs").insert({
        usuario_email: "admin@edumin.pe",
        accion: "CUOTA_VALIDADA_MANUAL",
        detalles: {
          pago_id: parsedCredito.id,
          dni_ce: student.dni_ce,
          num_credito: parsedCredito.num_credito,
          estudiante: `${student.nombres} ${student.apellidos}`,
          cuotas: parsedCredito.cuotas,
          total_pagado: parsedCredito.total_pagado,
          total_deuda: parsedCredito.total_deuda,
          monto_pagado: montoPago,
          metodo,
          comprobante
        }
      });
    } catch (err) {
      console.error(err);
    }

    // Webhook n8n
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
    let webhookDelivered = false;

    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evento: "pago_registrado",
            nombre_alumno: `${student.nombres} ${student.apellidos}`,
            dni_ce: student.dni_ce,
            num_credito: parsedCredito.num_credito,
            total_pagado: parsedCredito.total_pagado,
            total_deuda: parsedCredito.total_deuda,
            monto_cuota_pagada: montoPago,
            metodo,
            comprobante
          }),
          cache: "no-store",
          signal: AbortSignal.timeout(10_000),
        });

        webhookDelivered = webhookResponse.ok;
      } catch (webhookError) {
        console.error("No fue posible notificar a n8n:", webhookError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Pago registrado y crédito actualizado correctamente en Supabase.",
      alumno: student,
      credito: parsedCredito,
      webhookStatus: webhookDelivered ? 200 : 500
    });
  } catch (error: any) {
    console.error("Error al registrar pago:", error);
    return NextResponse.json({ error: error.message || "Error al registrar pago" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    // ACCIÓN 1: ANULAR CUOTA / PAGO DE CRÉDITO O CARGO EXTRA
    if (body.action === "anular") {
      const { pago_id, dni_ce, num_credito, cuota_index, motivo_anulacion } = body;

      if (!motivo_anulacion || !motivo_anulacion.trim()) {
        return NextResponse.json({ error: "Debe ingresar un motivo de anulación obligatorio." }, { status: 400 });
      }

      const { data: targetCredit } = pago_id
        ? await admin.from("pagos").select("*").eq("id", pago_id).maybeSingle()
        : await admin.from("pagos").select("*").eq("dni_ce", dni_ce).order("created_at", { ascending: true }).limit(1).maybeSingle();

      if (!targetCredit) {
        return NextResponse.json({ error: "Registro de pago no encontrado para anulación." }, { status: 404 });
      }

      // Si es un cargo extra suelto, eliminar o marcar estado Anulado
      if (typeof targetCredit.metodo === 'string' && targetCredit.metodo.startsWith('CARGO_EXTRA|')) {
        await admin.from("pagos").update({ estado: "ANULADO" }).eq("id", targetCredit.id);

        try {
          await admin.from("audit_logs").insert({
            usuario_email: "admin@edumin.pe",
            accion: "ANULACION_CARGO_EXTRA",
            detalles: {
              pago_id: targetCredit.id,
              dni_ce: targetCredit.dni_ce,
              motivo_anulacion: motivo_anulacion.trim()
            }
          });
        } catch (e) {
          console.error(e);
        }

        return NextResponse.json({
          success: true,
          message: "Cargo extra anulado exitosamente en Supabase."
        });
      }

      const { data: auditLogs } = await admin.from("audit_logs").select("*").order("created_at", { ascending: false });
      const parsedCredito = parseCreditoRow(targetCredit, auditLogs || []);

      const idxToReset = cuota_index !== undefined && cuota_index !== null ? Number(cuota_index) : 0;
      const updatedCuotas = [...parsedCredito.cuotas];
      if (idxToReset >= 0 && idxToReset < updatedCuotas.length && updatedCuotas[idxToReset] !== 'no corresponde') {
        updatedCuotas[idxToReset] = '0';
      }

      const newTotalPagado = updatedCuotas.reduce((sum: number, val: string) => {
        return val !== 'no corresponde' ? sum + (Number(val) || 0) : sum;
      }, 0);

      const newTotalDeuda = Math.max(0, parsedCredito.monto - newTotalPagado);

      const metadataMetodo = `CREDITO_${parsedCredito.num_credito}|${JSON.stringify({
        num_credito: parsedCredito.num_credito,
        cuotas: updatedCuotas,
        total_pagado: newTotalPagado,
        total_deuda: newTotalDeuda
      })}`;

      await admin.from("pagos").update({
        metodo: metadataMetodo,
        estado: newTotalDeuda === 0 ? "Completado" : "Pendiente"
      }).eq("id", parsedCredito.id);

      // Auditoría forense
      try {
        await admin.from("audit_logs").insert({
          usuario_email: "admin@edumin.pe",
          accion: "ANULACION_PAGO_CON_JUSTIFICACION",
          detalles: {
            pago_id: parsedCredito.id,
            dni_ce: parsedCredito.dni_ce,
            num_credito: parsedCredito.num_credito,
            cuota_index: idxToReset,
            motivo_anulacion: motivo_anulacion.trim(),
            cuotas: updatedCuotas,
            total_pagado: newTotalPagado,
            total_deuda: newTotalDeuda
          }
        });
      } catch (e) {
        console.error(e);
      }

      // Webhook n8n
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
      let webhookDelivered = false;
      if (webhookUrl) {
        try {
          const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              evento: "pago_anulado",
              pago_id: parsedCredito.id,
              dni_ce: parsedCredito.dni_ce,
              num_credito: parsedCredito.num_credito,
              cuota_index: idxToReset,
              motivo_anulacion: motivo_anulacion.trim(),
              timestamp: new Date().toISOString()
            }),
            cache: "no-store",
            signal: AbortSignal.timeout(10_000)
          });
          webhookDelivered = res.ok;
        } catch (e) {
          console.error(e);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Anulación registrada y reflejada en Supabase y n8n.",
        webhookDelivered
      });
    }

    // ACCIÓN 2: EDITAR CRONOGRAMA DE UN CRÉDITO ESPECÍFICO CON VALIDACIÓN DE SUMA
    if (body.action === "editar_cronograma") {
      const { pago_id, dni_ce, num_credito, monto_total, cuotas } = body;

      const { data: creditRow } = pago_id
        ? await admin.from("pagos").select("*").eq("id", pago_id).maybeSingle()
        : await admin.from("pagos").select("*").eq("dni_ce", dni_ce).limit(1).maybeSingle();

      if (!creditRow) {
        return NextResponse.json({ error: "Crédito no encontrado para editar cronograma." }, { status: 404 });
      }

      const totalMontoCredito = Number(monto_total) || Number(creditRow.monto) || 0;
      const cuotasArray: string[] = Array.isArray(cuotas) ? cuotas : ['0', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'];

      const sumaCuotas = cuotasArray.reduce((acc: number, val: string) => {
        return val !== 'no corresponde' ? acc + (Number(val) || 0) : acc;
      }, 0);

      if (Math.abs(sumaCuotas - totalMontoCredito) > 0.01) {
        return NextResponse.json({
          error: `Error de Validación: La suma de las cuotas (S/ ${sumaCuotas.toFixed(2)}) no coincide con el total del crédito/programa (S/ ${totalMontoCredito.toFixed(2)}).`
        }, { status: 400 });
      }

      const totalPagadoCalculado = cuotasArray.reduce((acc: number, val: string) => {
        return val !== 'no corresponde' && Number(val) > 0 ? acc + Number(val) : acc;
      }, 0);

      const totalDeudaCalculada = Math.max(0, totalMontoCredito - totalPagadoCalculado);

      const metadataMetodo = `CREDITO_${num_credito || creditRow.num_credito || 1}|${JSON.stringify({
        num_credito: num_credito || creditRow.num_credito || 1,
        cuotas: cuotasArray,
        total_pagado: totalPagadoCalculado,
        total_deuda: totalDeudaCalculada
      })}`;

      await admin.from("pagos").update({
        monto: totalMontoCredito,
        metodo: metadataMetodo,
        estado: totalDeudaCalculada === 0 ? "Completado" : "Pendiente"
      }).eq("id", creditRow.id);

      try {
        await admin.from("audit_logs").insert({
          usuario_email: "admin@edumin.pe",
          accion: "EDITAR_CRONOGRAMA_PAGOS",
          detalles: {
            pago_id: creditRow.id,
            dni_ce: creditRow.dni_ce,
            monto_total: totalMontoCredito,
            cuotas: cuotasArray,
            total_pagado: totalPagadoCalculado,
            total_deuda: totalDeudaCalculada
          }
        });
      } catch (e) {
        console.error(e);
      }

      return NextResponse.json({
        success: true,
        message: "Cronograma actualizado exitosamente en Supabase."
      });
    }

    return NextResponse.json({ error: "Acción no reconocida." }, { status: 400 });
  } catch (error: any) {
    console.error("Error en PATCH pagos:", error);
    return NextResponse.json({ error: error.message || "Error interno al actualizar pago." }, { status: 500 });
  }
}
