import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obtenerSiguienteCorrelativo, parsearNumeroCorrelativo, formatearNroRecibo } from "@/lib/utils/reciboCorrelativo";
import { calcularFechasVencimientoPorDefecto, resolverFechaVencimiento } from "@/lib/utils/fechasCuotas";

function parseCreditoRow(pag: any, auditLogs: any[]) {
  if (typeof pag.metodo === 'string' && pag.metodo.startsWith('CARGO_EXTRA|')) {
    const rawContent = pag.metodo.replace('CARGO_EXTRA|', '');
    let concepto = rawContent;
    let nro_recibo: string | undefined = pag.nro_recibo || undefined;
    let nro_operacion: string | undefined = pag.nro_operacion || undefined;
    if (rawContent.startsWith('{')) {
      try {
        const parsedCargo = JSON.parse(rawContent);
        concepto = parsedCargo.concepto || concepto;
        nro_recibo = parsedCargo.nro_recibo || nro_recibo;
        nro_operacion = parsedCargo.nro_operacion || nro_operacion;
      } catch {}
    }
    return {
      id: pag.id,
      profile_id: pag.profile_id,
      dni_ce: pag.dni_ce,
      is_cargo_extra: true,
      concepto,
      nro_cuota: `Cargo extra (${concepto})`,
      num_credito: 99,
      nro_recibo,
      nro_operacion,
      comprobante: nro_recibo || pag.comprobante || undefined,
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
  let explicitDeuda: number | undefined = undefined;
  let parsedFromMetodo = false;
  let plan_cuotas: string[] | null = null;
  let cuotas_recibos: Record<number, { nro_recibo?: string; nro_operacion?: string; fecha?: string }> = {};
  let fechas_vencimiento: string[] | null = null;
  let nro_pagare: string | undefined = pag.nro_pagare || undefined;
  let nro_recibo: string | undefined = pag.nro_recibo || undefined;
  let nro_operacion: string | undefined = pag.nro_operacion || undefined;
  let comprobante: string | undefined = pag.comprobante || undefined;

  if (typeof pag.metodo === 'string' && pag.metodo.startsWith('CREDITO_')) {
    try {
      const jsonStr = pag.metodo.substring(pag.metodo.indexOf('|') + 1).trim();
      const parsed = JSON.parse(jsonStr);
      num_credito = parsed.num_credito || num_credito;
      if (parsed.nro_pagare) nro_pagare = parsed.nro_pagare;
      if (parsed.cuotas_recibos && typeof parsed.cuotas_recibos === 'object') {
        cuotas_recibos = { ...parsed.cuotas_recibos };
      }
      if (Array.isArray(parsed.fechas_vencimiento)) {
        fechas_vencimiento = parsed.fechas_vencimiento;
      }
      if (parsed.ultimo_pago?.nro_recibo) nro_recibo = parsed.ultimo_pago.nro_recibo;
      if (parsed.ultimo_pago?.nro_operacion) nro_operacion = parsed.ultimo_pago.nro_operacion;
      if (parsed.ultimo_pago?.comprobante) comprobante = parsed.ultimo_pago.comprobante;
      if (Array.isArray(parsed.cuotas)) {
        cuotas = parsed.cuotas;
        parsedFromMetodo = true;
      }
      if (Array.isArray(parsed.plan_cuotas)) {
        plan_cuotas = parsed.plan_cuotas;
      }
      if (parsed.total_pagado !== undefined) {
        total_pagado = Number(parsed.total_pagado);
      }
      if (parsed.total_deuda !== undefined) {
        explicitDeuda = Number(parsed.total_deuda);
      }
    } catch {
      // ignore
    }
  }

  if (!parsedFromMetodo) {
    const auditEntry = (auditLogs || []).find((a: any) => a.detalles?.pago_id === pag.id);
    if (auditEntry?.detalles) {
      num_credito = auditEntry.detalles.num_credito || num_credito;
      cuotas = auditEntry.detalles.cuotas || cuotas;
      if (auditEntry.detalles.nro_pagare) nro_pagare = auditEntry.detalles.nro_pagare;
      if (Array.isArray(auditEntry.detalles.plan_cuotas)) plan_cuotas = auditEntry.detalles.plan_cuotas;
      if (Array.isArray(auditEntry.detalles.fechas_vencimiento)) fechas_vencimiento = auditEntry.detalles.fechas_vencimiento;
      if (auditEntry.detalles.cuotas_recibos && typeof auditEntry.detalles.cuotas_recibos === 'object') {
        cuotas_recibos = { ...auditEntry.detalles.cuotas_recibos };
      }
      if (auditEntry.detalles.total_pagado !== undefined) total_pagado = Number(auditEntry.detalles.total_pagado);
      if (auditEntry.detalles.total_deuda !== undefined) explicitDeuda = Number(auditEntry.detalles.total_deuda);
    }
  }

  // Reconciliación forense desde audit_logs para cuotas pagadas sin recibo asignado
  const studentAudits = (auditLogs || [])
    .filter((a: any) => (a.detalles?.pago_id === pag.id || a.detalles?.dni_ce === pag.dni_ce) && a.accion === 'CUOTA_VALIDADA_MANUAL')
    .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  cuotas.forEach((val, idx) => {
    if (val !== 'no corresponde' && Number(val) > 0) {
      if (!cuotas_recibos[idx] || !cuotas_recibos[idx].nro_recibo) {
        const auditMatch = studentAudits.find((a: any) => a.detalles?.cuota_index === idx) || studentAudits[idx];
        if (auditMatch?.detalles?.nro_recibo) {
          cuotas_recibos[idx] = {
            nro_recibo: auditMatch.detalles.nro_recibo,
            nro_operacion: auditMatch.detalles.nro_operacion || null,
            fecha: auditMatch.created_at
          };
        } else if (idx === 0 && pag.nro_recibo && !Object.values(cuotas_recibos).some(r => r.nro_recibo === pag.nro_recibo)) {
          cuotas_recibos[idx] = {
            nro_recibo: pag.nro_recibo,
            nro_operacion: pag.nro_operacion || null,
            fecha: pag.created_at
          };
        }
      }
    }
  });

  const cuotasActivasTotal = cuotas.filter(c => c !== 'no corresponde').length;
  if (!fechas_vencimiento || fechas_vencimiento.length === 0) {
    fechas_vencimiento = calcularFechasVencimientoPorDefecto(pag.created_at, Math.max(1, cuotasActivasTotal));
  }

  if (Array.isArray(cuotas)) {
    const sumCuotasPagadas = cuotas.reduce((sum: number, val: string) => {
      return val !== 'no corresponde' ? sum + (Number(val) || 0) : sum;
    }, 0);
    if (sumCuotasPagadas > 0 || total_pagado === 0) {
      total_pagado = sumCuotasPagadas;
    }
  }

  let total_deuda = explicitDeuda !== undefined
    ? explicitDeuda
    : Math.max(0, Number(pag.monto || 0) - total_pagado);

  const montoTotal = Math.max(Number(pag.monto || 0), total_pagado + total_deuda);

  return {
    id: pag.id,
    profile_id: pag.profile_id,
    dni_ce: pag.dni_ce,
    num_credito,
    nro_pagare,
    nro_recibo,
    nro_operacion,
    comprobante,
    monto: montoTotal,
    metodo: pag.metodo && !pag.metodo.startsWith('CREDITO_') ? pag.metodo : 'Por Pagar',
    estado: total_deuda === 0 ? 'Completado' : (pag.estado || 'Pendiente'),
    created_at: pag.created_at,
    cuotas,
    plan_cuotas,
    cuotas_recibos,
    fechas_vencimiento,
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

    return NextResponse.json({ pagos: creditosFmt, siguiente_recibo: obtenerSiguienteCorrelativo(creditosFmt, auditLogs || []) });
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
    const nro_recibo = typeof body.nro_recibo === 'string' ? body.nro_recibo.trim() : (body.recibo || '');
    const nro_operacion = typeof body.nro_operacion === 'string' ? body.nro_operacion.trim() : (body.operacion || '');
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
      .select("id, numero_documento, nombres, apellidos, paquete_adquirido, cuotas_pagadas")
      .eq("numero_documento", dni)
      .maybeSingle();

    if (studentError || !student) {
      return NextResponse.json({ error: "Alumno no encontrado con el DNI proporcionado." }, { status: 404 });
    }

    // Consultar correlativos institucionales existentes para asegurar unicidad estricta
    const [{ data: todosPagos }, { data: todosAudits }] = await Promise.all([
      admin.from("pagos").select("*"),
      admin.from("audit_logs").select("*")
    ]);
    const siguienteCorrelativo = obtenerSiguienteCorrelativo(todosPagos || [], todosAudits || []);

    let nroReciboFinal = nro_recibo;
    const reciboYaExiste = nroReciboFinal && (todosPagos || []).some((p: any) => {
      if (p.id === pagoId && !isCargoExtra) return false;
      if (p.nro_recibo === nroReciboFinal) return true;
      if (typeof p.metodo === 'string' && p.metodo.includes(`"nro_recibo":"${nroReciboFinal}"`)) return true;
      return false;
    });

    if (!nroReciboFinal || reciboYaExiste) {
      nroReciboFinal = siguienteCorrelativo;
    }

    const nroOperacionFinal = nro_operacion && nro_operacion.trim() !== '' ? nro_operacion.trim() : null;

    // CASO ESPECIAL: REGISTRAR CARGO EXTRA (Examen sustitutorio, mora, etc.)
    if (isCargoExtra) {
      const cargoMetadata = JSON.stringify({
        concepto: conceptoCargo,
        nro_recibo: nroReciboFinal,
        nro_operacion: nroOperacionFinal,
        metodo_pago: metodo,
        fecha: new Date().toISOString()
      });

      const extraPayload: Record<string, any> = {
        profile_id: student.id,
        dni_ce: student.numero_documento,
        monto: montoPago,
        metodo: `CARGO_EXTRA|${cargoMetadata}`,
        estado: "APROBADO"
      };

      const res = await admin.from("pagos").insert(extraPayload).select().single();
      const newCargo = res.data;
      const cargoErr = res.error;

      if (cargoErr) {
        return NextResponse.json({ error: `Error al insertar cargo extra: ${cargoErr.message}` }, { status: 500 });
      }

      try {
        await admin.from("audit_logs").insert({
          usuario_email: "admin@edumin.pe",
          accion: "CARGO_EXTRA_REGISTRADO",
          detalles: {
            pago_id: newCargo.id,
            dni_ce: student.numero_documento,
            estudiante: `${student.nombres} ${student.apellidos}`,
            concepto: conceptoCargo,
            monto: montoPago,
            metodo,
            comprobante: nroReciboFinal,
            nro_recibo: nroReciboFinal,
            nro_operacion: nroOperacionFinal
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
              dni_ce: student.numero_documento,
              concepto: conceptoCargo,
              monto: montoPago,
              metodo,
              comprobante,
              nro_recibo,
              nro_operacion
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
        dni_ce: student.numero_documento,
        monto: montoPago,
        metodo: metadataMetodo,
        estado: "Pendiente"
      }).select().single();

      targetCreditRow = newPago;
      parsedCredito = parseCreditoRow(newPago, auditLogs || []);
    } else {
      const updatedCuotas = [...parsedCredito.cuotas];
      const planCuotas = Array.isArray(parsedCredito.plan_cuotas) ? parsedCredito.plan_cuotas : null;
      
      let targetIdx = cuotaIndex;
      if (targetIdx === null || targetIdx < 0 || targetIdx > 5) {
        // Encontrar la primera cuota que aún tenga saldo pendiente
        targetIdx = updatedCuotas.findIndex((val: string, idx: number) => {
          if (val === 'no corresponde') return false;
          const planVal = planCuotas?.[idx] ? Number(planCuotas[idx]) : 0;
          const pagadoVal = Number(val) || 0;
          return planVal > 0 ? pagadoVal < planVal : pagadoVal === 0;
        });
        if (targetIdx === -1) {
          targetIdx = 0;
        }
      }

      // Distribución inteligente (cascada): abona a la cuota seleccionada y si sobra dinero pasa a la siguiente
      const cuotasActivasCount = updatedCuotas.filter(c => c !== 'no corresponde').length;
      const cuotaEsperadaFallback = Math.round(parsedCredito.monto / Math.max(1, cuotasActivasCount));

      let montoRestante = montoPago;

      for (let i = targetIdx; i < updatedCuotas.length; i++) {
        if (updatedCuotas[i] === 'no corresponde') continue;
        if (montoRestante <= 0) break;

        const planCuota = planCuotas?.[i] ? Number(planCuotas[i]) : cuotaEsperadaFallback;
        const yaPagado = Number(updatedCuotas[i]) || 0;
        const pendienteCuota = Math.max(0, planCuota - yaPagado);

        const esUltimaCuotaActiva = updatedCuotas.slice(i + 1).every(c => c === 'no corresponde');

        if (esUltimaCuotaActiva || montoRestante <= pendienteCuota || pendienteCuota === 0) {
          updatedCuotas[i] = String(yaPagado + montoRestante);
          montoRestante = 0;
        } else {
          updatedCuotas[i] = String(yaPagado + pendienteCuota);
          montoRestante -= pendienteCuota;
        }
      }

      const newTotalPagado = updatedCuotas.reduce((sum: number, val: string) => {
        return val !== 'no corresponde' ? sum + (Number(val) || 0) : sum;
      }, 0);

      const newTotalDeuda = Math.max(0, parsedCredito.monto - newTotalPagado);

      const currentCuotasRecibos = { ...(parsedCredito.cuotas_recibos || {}) };

      // Identificar qué cuotas recibieron abono en esta operación
      const cuotasAfectadas: number[] = [];
      for (let i = 0; i < updatedCuotas.length; i++) {
        if (updatedCuotas[i] !== 'no corresponde' && Number(updatedCuotas[i]) > (Number(parsedCredito.cuotas[i]) || 0)) {
          cuotasAfectadas.push(i);
        }
      }
      if (cuotasAfectadas.length === 0) {
        cuotasAfectadas.push(cuotaIndex !== null ? cuotaIndex : targetIdx);
      }

      cuotasAfectadas.forEach((cIdx, aIdx) => {
        let reciboCuota = nroReciboFinal;
        if (aIdx > 0) {
          const numCorrelativoBase = parsearNumeroCorrelativo(nroReciboFinal) || 1;
          reciboCuota = formatearNroRecibo(numCorrelativoBase + aIdx);
        }
        currentCuotasRecibos[cIdx] = {
          nro_recibo: reciboCuota,
          nro_operacion: nroOperacionFinal,
          fecha: new Date().toISOString()
        };
      });

      const metadataMetodo = `CREDITO_${parsedCredito.num_credito}|${JSON.stringify({
        num_credito: parsedCredito.num_credito,
        nro_pagare: parsedCredito.nro_pagare || undefined,
        cuotas: updatedCuotas,
        plan_cuotas: parsedCredito.plan_cuotas || null,
        cuotas_recibos: currentCuotasRecibos,
        fechas_vencimiento: parsedCredito.fechas_vencimiento || null,
        total_pagado: newTotalPagado,
        total_deuda: newTotalDeuda,
        ultimo_pago: {
          monto: montoPago,
          metodo,
          nro_recibo: nroReciboFinal,
          nro_operacion: nroOperacionFinal,
          comprobante: nroReciboFinal,
          fecha: new Date().toISOString()
        }
      })}`;

      const updatePayload: Record<string, any> = {
        metodo: metadataMetodo,
        estado: newTotalDeuda === 0 ? "Completado" : "Pendiente"
      };

      const { error: updErr } = await admin.from("pagos").update(updatePayload).eq("id", parsedCredito.id);
      if (updErr) {
        console.warn('Advertencia al actualizar pagos:', updErr.message);
      }

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
          dni_ce: student.numero_documento,
          num_credito: parsedCredito.num_credito,
          estudiante: `${student.nombres} ${student.apellidos}`,
          cuotas: parsedCredito.cuotas,
          total_pagado: parsedCredito.total_pagado,
          total_deuda: parsedCredito.total_deuda,
          monto_pagado: montoPago,
          metodo,
          comprobante: nroReciboFinal,
          nro_recibo: nroReciboFinal,
          nro_operacion: nroOperacionFinal
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
            dni_ce: student.numero_documento,
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
    if (body.action === "editar_cronograma" || (body.cuotas && !body.action)) {
      const { pago_id, dni_ce, num_credito, monto_total, cuotas, nro_pagare, fechas_vencimiento } = body;

      const { data: creditRow } = pago_id
        ? await admin.from("pagos").select("*").eq("id", pago_id).maybeSingle()
        : await admin.from("pagos").select("*").eq("dni_ce", dni_ce).limit(1).maybeSingle();

      if (!creditRow) {
        return NextResponse.json({ error: "Crédito no encontrado para editar cronograma." }, { status: 404 });
      }

      const prevParsed = parseCreditoRow(creditRow, []);
      const totalMontoCredito = Number(monto_total) || Number(creditRow.monto) || 0;
      const planCuotasArray: string[] = Array.isArray(cuotas) ? cuotas : ['0', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'];

      const sumaCuotas = planCuotasArray.reduce((acc: number, val: string) => {
        return val !== 'no corresponde' ? acc + (Number(val) || 0) : acc;
      }, 0);

      if (Math.abs(sumaCuotas - totalMontoCredito) > 0.01) {
        return NextResponse.json({
          error: `Error de Validación: La suma de las cuotas (S/ ${sumaCuotas.toFixed(2)}) no coincide con el total del crédito/programa (S/ ${totalMontoCredito.toFixed(2)}).`
        }, { status: 400 });
      }

      // Preservar los pagos reales que ya realizó el alumno en cada cuota
      const prevCuotas = [...prevParsed.cuotas];
      const updatedCuotas = planCuotasArray.map((pVal, idx) => {
        if (pVal === 'no corresponde') return 'no corresponde';
        const prevP = prevCuotas[idx];
        return prevP && prevP !== 'no corresponde' ? prevP : '0';
      });

      const totalPagadoCalculado = updatedCuotas.reduce((acc: number, val: string) => {
        return val !== 'no corresponde' && Number(val) > 0 ? acc + Number(val) : acc;
      }, 0);

      const totalDeudaCalculada = Math.max(0, totalMontoCredito - totalPagadoCalculado);
      const nroPagareFinal = nro_pagare || prevParsed.nro_pagare;
      const fechasVencimientoFinal = Array.isArray(fechas_vencimiento) ? fechas_vencimiento : (prevParsed.fechas_vencimiento || null);

      const metadataMetodo = `CREDITO_${num_credito || creditRow.num_credito || 1}|${JSON.stringify({
        num_credito: num_credito || creditRow.num_credito || 1,
        nro_pagare: nroPagareFinal || undefined,
        cuotas: updatedCuotas,
        plan_cuotas: planCuotasArray,
        cuotas_recibos: prevParsed.cuotas_recibos || {},
        fechas_vencimiento: fechasVencimientoFinal,
        total_pagado: totalPagadoCalculado,
        total_deuda: totalDeudaCalculada
      })}`;

      const updatePayload: Record<string, any> = {
        monto: totalMontoCredito,
        metodo: metadataMetodo,
        estado: totalDeudaCalculada === 0 ? "Completado" : "Pendiente"
      };
      if (nroPagareFinal) updatePayload.nro_pagare = nroPagareFinal;

      const { error: updErr } = await admin.from("pagos").update(updatePayload).eq("id", creditRow.id);
      if (updErr) {
        console.warn('Advertencia al guardar nro_pagare (posible columna no migrada en BD):', updErr.message);
        delete updatePayload.nro_pagare;
        await admin.from("pagos").update(updatePayload).eq("id", creditRow.id);
      }

      try {
        await admin.from("audit_logs").insert({
          usuario_email: "admin@edumin.pe",
          accion: "EDITAR_CRONOGRAMA_PAGOS",
          detalles: {
            pago_id: creditRow.id,
            dni_ce: creditRow.dni_ce,
            monto_total: totalMontoCredito,
            cuotas: updatedCuotas,
            plan_cuotas: planCuotasArray,
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

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    const { pago_id, dni_ce, num_credito, cuota_index, motivo_anulacion, is_cargo_extra } = body;
    const motivoFinal = (motivo_anulacion && String(motivo_anulacion).trim()) || "Anulación manual administrativa desde ficha 360";

    const { data: targetCredit } = pago_id
      ? await admin.from("pagos").select("*").eq("id", pago_id).maybeSingle()
      : await admin.from("pagos").select("*").eq("dni_ce", dni_ce).order("created_at", { ascending: true }).limit(1).maybeSingle();

    if (!targetCredit) {
      return NextResponse.json({ error: "Registro de pago no encontrado para anulación." }, { status: 404 });
    }

    // Si es un cargo extra suelto, marcar estado Anulado
    if (is_cargo_extra || (typeof targetCredit.metodo === 'string' && targetCredit.metodo.startsWith('CARGO_EXTRA|'))) {
      await admin.from("pagos").update({ estado: "ANULADO" }).eq("id", targetCredit.id);

      try {
        await admin.from("audit_logs").insert({
          usuario_email: "admin@edumin.pe",
          accion: "ANULACION_CARGO_EXTRA",
          detalles: {
            pago_id: targetCredit.id,
            dni_ce: targetCredit.dni_ce,
            motivo_anulacion: motivoFinal
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

    const currentCuotasRecibos = { ...(parsedCredito.cuotas_recibos || {}) };
    delete currentCuotasRecibos[idxToReset];

    const metadataMetodo = `CREDITO_${parsedCredito.num_credito}|${JSON.stringify({
      num_credito: parsedCredito.num_credito,
      nro_pagare: parsedCredito.nro_pagare || undefined,
      cuotas: updatedCuotas,
      plan_cuotas: parsedCredito.plan_cuotas || null,
      cuotas_recibos: currentCuotasRecibos,
      fechas_vencimiento: parsedCredito.fechas_vencimiento || null,
      total_pagado: newTotalPagado,
      total_deuda: newTotalDeuda
    })}`;

    const updateDeletePayload: Record<string, any> = {
      metodo: metadataMetodo,
      estado: newTotalDeuda === 0 ? "Completado" : "Pendiente"
    };

    const { error: delUpdErr } = await admin.from("pagos").update(updateDeletePayload).eq("id", parsedCredito.id);
    if (delUpdErr) {
      console.warn('Advertencia al anular pago:', delUpdErr.message);
    }

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
          motivo_anulacion: motivoFinal,
          cuotas: updatedCuotas,
          total_pagado: newTotalPagado,
          total_deuda: newTotalDeuda
        }
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({
      success: true,
      message: "Cuota anulada exitosamente en el cronograma."
    });
  } catch (error: any) {
    console.error("Error en DELETE /api/admin/pagos:", error);
    return NextResponse.json({ error: error.message || "Error al anular pago" }, { status: 500 });
  }
}
