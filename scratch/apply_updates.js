const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const diplomadoLogisticaObj = {
  id: "gestion-logistica-y-proveedores-en-industria-y-mineria",
  slug: "gestion-logistica-y-proveedores-en-industria-y-mineria",
  titulo: "GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA",
  avance: 0,
  modulos: [
    {
      id: "MÓDULO 01",
      codigo: "MÓDULO 01",
      nombre: "COSTOS Y PRESUPUESTOS DE ALMACENES EN INDUSTRIA Y MINERIA",
      nota: 0,
      completado: false
    },
    {
      id: "MÓDULO 02",
      codigo: "MÓDULO 02",
      nombre: "ESTRATEGIAS GLOBALES EN COMPRAS INTERNACIONALES",
      nota: 0,
      completado: false
    },
    {
      id: "MÓDULO 03",
      codigo: "MÓDULO 03",
      nombre: "IDENTIFICACIÓN Y GESTIÓN AVANZADA DE RIESGOS EN LA LOGÍSTICA MINERA",
      nota: 0,
      completado: false
    }
  ]
};

const diplomadosLogisticaString = `DIPLOMADOS_LIST|${JSON.stringify([diplomadoLogisticaObj])}`;

async function runUpdates() {
  console.log('=== 1. ACTUALIZAR CARLOS PAIVA (73901770) A BÁSICO 199 ===');
  const { data: pCarlos, error: errPCarlos } = await supabase
    .from('profiles')
    .select('id, cupos_creditos')
    .eq('numero_documento', '73901770')
    .single();

  if (errPCarlos || !pCarlos) {
    console.error('Error buscando a Carlos Paiva:', errPCarlos);
    process.exit(1);
  }

  const { error: updCarlos } = await supabase
    .from('profiles')
    .update({
      paquete_adquirido: 'BASICO',
      cupos_creditos: {
        diplomados: { asignados: 1, canjeados: 1, adicionales: 0 },
        cursos: { asignados: 0, canjeados: 0, adicionales: 0 },
        compras_directas: []
      }
    })
    .eq('id', pCarlos.id);

  if (updCarlos) {
    console.error('Error actualizando perfil Carlos Paiva:', updCarlos);
  } else {
    console.log('Carlos Paiva actualizado con éxito a paquete BÁSICO.');
  }

  console.log('\n=== 2. ACTUALIZAR LOS 5 ALUMNOS DE LOGÍSTICA Y PROVEEDORES ===');
  const dnisLogistica = ['42212075', '73108217', '75022316', '47467383', '75220627'];

  for (const dni of dnisLogistica) {
    const { data: prof, error: getProfErr } = await supabase
      .from('profiles')
      .select('id, numero_documento, nombres, apellidos, diplomados')
      .eq('numero_documento', dni)
      .single();

    if (getProfErr || !prof) {
      console.error(`Error buscando alumno DNI ${dni}:`, getProfErr);
      continue;
    }

    const { error: updDipErr } = await supabase
      .from('profiles')
      .update({ diplomados: diplomadosLogisticaString })
      .eq('id', prof.id);

    if (updDipErr) {
      console.error(`Error actualizando diplomado de DNI ${dni}:`, updDipErr);
    } else {
      console.log(`DNI ${dni} (${prof.nombres} ${prof.apellidos}): Diplomado actualizado a "GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA".`);
    }
  }

  console.log('\n=== 3. AJUSTAR CRONOGRAMA DE CUOTAS PARA JUAN CARLOS HANNER (42212075) ===');
  const { data: pagoHanner, error: errPagoHanner } = await supabase
    .from('pagos')
    .select('*')
    .eq('dni_ce', '42212075')
    .single();

  if (pagoHanner) {
    try {
      const jsonStr = pagoHanner.metodo?.replace(/^CREDITO_\d+\|/, '');
      const parsed = JSON.parse(jsonStr);

      parsed.cuotas = ["250", "250", "250", "250", "250", "250"];
      parsed.plan_cuotas = ["250", "250", "250", "250", "250", "250"];
      parsed.total_pagado = 250;
      parsed.total_deuda = 1250;

      const newMetodo = `CREDITO_1|${JSON.stringify(parsed)}`;

      const { error: updPagoHannerErr } = await supabase
        .from('pagos')
        .update({
          monto: 1500,
          metodo: newMetodo,
          estado: 'Pendiente'
        })
        .eq('id', pagoHanner.id);

      if (updPagoHannerErr) {
        console.error('Error actualizando cuotas de Juan Carlos Hanner:', updPagoHannerErr);
      } else {
        console.log('Juan Carlos Hanner: Cronograma ajustado a 6 cuotas de S/ 250 (Total: 1500, Pagado: 250, Deuda: 1250).');
      }
    } catch(e) {
      console.error('Error parseando metodo de Juan Carlos Hanner:', e);
    }
  }

  console.log('\n=== VERIFICACIÓN FINAL DE LOS 6 ALUMNOS EN SUPABASE ===');
  const { data: finalProfiles } = await supabase
    .from('profiles')
    .select('numero_documento, nombres, apellidos, paquete_adquirido, diplomados')
    .in('numero_documento', ['73901770', ...dnisLogistica]);

  const { data: finalPagos } = await supabase
    .from('pagos')
    .select('dni_ce, monto, estado, metodo')
    .in('dni_ce', ['73901770', ...dnisLogistica]);

  finalProfiles.forEach(p => {
    let dipTitle = '';
    try {
      const list = JSON.parse(p.diplomados.replace('DIPLOMADOS_LIST|', ''));
      dipTitle = list[0]?.titulo || '';
    } catch(e) {}
    const pag = finalPagos.find(pg => pg.dni_ce === p.numero_documento);
    console.log(`- DNI ${p.numero_documento} | ${p.nombres} ${p.apellidos} | Paquete: ${p.paquete_adquirido} | Diplomado: ${dipTitle} | Monto contrato: S/ ${pag?.monto} | Estado: ${pag?.estado}`);
  });

  process.exit(0);
}

runUpdates();
