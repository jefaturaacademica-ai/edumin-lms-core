const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const listadoRaw = [
  { dni: '73247528', paquete: 'ESTANDAR' },
  { dni: '71421710', paquete: 'AVANZADO' },
  { dni: '71900766', paquete: 'AVANZADO' },
  { dni: '40676948', paquete: 'AVANZADO' },
  { dni: '72618876', paquete: 'AVANZADO' },
  { dni: '47974848', paquete: 'AVANZADO' },
  { dni: '73954256', paquete: 'AVANZADO' },
  { dni: '77300057', paquete: 'UPSELLING' },
  { dni: '73227033', paquete: 'UPSELLING' },
  { dni: '71974123', paquete: 'AVANZADO_2' },
  { dni: '71950241', paquete: 'UPSELLING' },
  { dni: '42584570', paquete: 'AVANZADO_2' },
  { dni: '42766055', paquete: 'AVANZADO_2' },
  { dni: '71033050', paquete: 'AVANZADO_2' },
  { dni: '71324157', paquete: 'UPSELLING' },
  { dni: '42763727', paquete: 'AVANZADO_2' },
  { dni: '48057186', paquete: 'BASICO' },
  { dni: '73901770', paquete: 'COMPLETO' }, // Carlos Eduardo Paiva Holguino (duplicado en la lista, fijado a COMPLETO)
  { dni: '71867546', paquete: 'ESTANDAR' },
  { dni: '70345239', paquete: 'AMNISTIA' },
  { dni: '70562700', paquete: 'AMNISTIA' },
  { dni: '46680094', paquete: 'AMNISTIA' },
  { dni: '45918453', paquete: 'AMNISTIA' },
  { dni: '47757697', paquete: 'AMNISTIA' },
  { dni: '20885885', paquete: 'AMNISTIA' },
  { dni: '75022316', paquete: 'AMNISTIA' },
  { dni: '71564810', paquete: 'AMNISTIA' },
  { dni: '46864610', paquete: 'AMNISTIA' },
  { dni: '71852289', paquete: 'BECA' }
];

async function run() {
  console.log('1. Asegurar paquete AMNISTIA en public.paquetes...');
  const { data: pkgAmnistia, error: errAmnistia } = await supabase
    .from('paquetes')
    .upsert({
      id: 'AMNISTIA',
      nombre: 'AMNISTÍA',
      descripcion: 'Paquete especial de amnistía académica (equivalente a AVANZADO - 2).',
      precio_contado: 600,
      precio_cuotas: 0,
      cuotas_sugeridas: 1,
      creditos_diplomados: 3,
      creditos_cursos: 0,
      duracion_meses: 12,
      diplomados_renovables: true,
      cert_cip: false,
      cert_internacional: false,
      bolsa_trabajo_regular: true,
      bolsa_trabajo_exclusiva: true,
      dreambuilder: true,
      es_personalizado: true,
      color_tag: 'emerald',
      orden: 10,
      incluye_modulares: true
    }, { onConflict: 'id' });

  if (errAmnistia) {
    console.error('Error insertando paquete AMNISTIA:', errAmnistia);
    process.exit(1);
  }
  console.log('Paquete AMNISTIA verificado en public.paquetes.');

  // Obtener todos los paquetes para conocer cupos oficiales
  const { data: todosPaquetes, error: errPaq } = await supabase.from('paquetes').select('*');
  const dictPaquetes = {};
  todosPaquetes.forEach(p => { dictPaquetes[p.id] = p; });

  console.log('2. Actualizando los 29 estudiantes...');
  const resultados = [];

  for (const item of listadoRaw) {
    const { data: profile, error: getErr } = await supabase
      .from('profiles')
      .select('id, numero_documento, nombres, apellidos, paquete_adquirido, cupos_creditos')
      .eq('numero_documento', item.dni)
      .single();

    if (getErr || !profile) {
      console.error(`No encontrado DNI ${item.dni}`);
      continue;
    }

    const pkgDef = dictPaquetes[item.paquete];
    if (!pkgDef) {
      console.error(`Definición no encontrada para paquete ${item.paquete}`);
      continue;
    }

    const currentCreditos = profile.cupos_creditos || {};
    const dipCanjeados = currentCreditos.diplomados?.canjeados ?? 1;
    const dipAdicionales = currentCreditos.diplomados?.adicionales ?? 0;
    const curCanjeados = currentCreditos.cursos?.canjeados ?? 0;
    const curAdicionales = currentCreditos.cursos?.adicionales ?? 0;

    const nuevoCuposCreditos = {
      diplomados: {
        asignados: Number(pkgDef.creditos_diplomados ?? 1),
        canjeados: dipCanjeados,
        adicionales: dipAdicionales
      },
      cursos: {
        asignados: Number(pkgDef.creditos_cursos ?? 0),
        canjeados: curCanjeados,
        adicionales: curAdicionales
      },
      compras_directas: currentCreditos.compras_directas || []
    };

    const { error: updErr } = await supabase
      .from('profiles')
      .update({
        paquete_adquirido: item.paquete,
        cupos_creditos: nuevoCuposCreditos
      })
      .eq('id', profile.id);

    if (updErr) {
      console.error(`Error actualizando DNI ${item.dni}:`, updErr.message);
    } else {
      resultados.push({
        dni: item.dni,
        nombre: `${profile.nombres} ${profile.apellidos}`,
        anterior: profile.paquete_adquirido,
        nuevo: item.paquete,
        creditos: `${nuevoCuposCreditos.diplomados.asignados} Dip. / ${nuevoCuposCreditos.cursos.asignados} Cur.`
      });
    }
  }

  console.log(`Exito: ${resultados.length} alumnos actualizados de ${listadoRaw.length}`);
  console.log(JSON.stringify(resultados, null, 2));
  process.exit(0);
}

run();
