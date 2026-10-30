import fs from 'fs';
import path from 'path';

const filePath = path.resolve('app/api/admin/estudiantes/route.ts');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes('export async function POST')) {
  const postFunction = `

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      dni_ce, 
      nombres, 
      apellidos, 
      email, 
      telefono, 
      paquete_adquirido, 
      tipo_pago, 
      cuotas_totales, 
      monto_total, 
      monto_cuota, 
      diplomado_1 
    } = body;

    if (!dni_ce || !nombres || !apellidos || !email) {
      return NextResponse.json(
        { error: 'DNI/CE, nombres, apellidos y correo electrónico son obligatorios.' }, 
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Verificar si ya existe en profiles por dni_ce o email
    const { data: existente } = await admin
      .from('profiles')
      .select('id, dni_ce, email')
      .or(\`dni_ce.eq.\${dni_ce.trim()},email.eq.\${email.trim().toLowerCase()}\`)
      .maybeSingle();

    if (existente) {
      return NextResponse.json(
        { error: \`Ya existe un usuario registrado con ese DNI (\${existente.dni_ce}) o correo (\${existente.email}).\` }, 
        { status: 400 }
      );
    }

    // 2. Crear usuario en Auth de Supabase (contraseña inicial: su DNI)
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDni = dni_ce.trim();
    let studentId: string;

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: normalizedDni,
      email_confirm: true,
      user_metadata: { dni_ce: normalizedDni }
    });

    if (authError) {
      const { data: userList } = await admin.auth.admin.listUsers();
      const existingAuth = userList?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
      if (existingAuth) {
        studentId = existingAuth.id;
      } else {
        return NextResponse.json({ error: \`Error en autenticación: \${authError.message}\` }, { status: 400 });
      }
    } else {
      studentId = authUser.user.id;
    }

    // 3. Preparar diplomado inicial
    const dipTitulo = diplomado_1 || 'DIPLOMADO EN DERECHO MINERO';
    const dipData = getDiplomadoByTitleOrSlug(dipTitulo);
    const modulosList = dipData?.modulos && dipData.modulos.length > 0
      ? dipData.modulos.map((m: any, mIdx: number) => ({
          id: m.codigo || \`Módulo \${(mIdx + 1).toString().padStart(2, '0')}\`,
          codigo: m.codigo || \`Módulo \${(mIdx + 1).toString().padStart(2, '0')}\`,
          nombre: m.nombre || \`Módulo \${(mIdx + 1).toString().padStart(2, '0')}\`,
          nota: 0,
          completado: false
        }))
      : [
          { id: 'mod-01', codigo: 'Módulo 01', nombre: \`Módulo 01 de \${dipTitulo}\`, nota: 0, completado: false },
          { id: 'mod-02', codigo: 'Módulo 02', nombre: \`Módulo 02 de \${dipTitulo}\`, nota: 0, completado: false },
          { id: 'mod-03', codigo: 'Módulo 03', nombre: \`Módulo 03 de \${dipTitulo}\`, nota: 0, completado: false }
        ];

    const diplomadosJson = [
      {
        id: dipData?.slug || dipTitulo.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        slug: dipData?.slug || dipTitulo.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        titulo: dipTitulo,
        avance: 0,
        modulos: modulosList
      }
    ];

    const diplomadosSerialized = \`DIPLOMADOS_LIST|\${JSON.stringify(diplomadosJson)}\`;

    const paquete = (paquete_adquirido || 'COMPLETO').toUpperCase();
    const esContado = tipo_pago === 'CONTADO';
    const numCuotasTotales = esContado ? 1 : Number(cuotas_totales || (paquete === 'ILIMITADO' ? 5 : 3));
    const montoTotalNum = Number(monto_total || (paquete === 'ILIMITADO' ? 1500 : (paquete === 'FULL' ? 900 : 540)));
    const montoCuotaNum = esContado 
      ? montoTotalNum 
      : Number(monto_cuota || (paquete === 'ILIMITADO' ? 300 : 180));

    // 4. Insertar en profiles
    const { data: newProfile, error: profileErr } = await admin
      .from('profiles')
      .insert({
        id: studentId,
        dni_ce: normalizedDni,
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        email: normalizedEmail,
        telefono: telefono ? telefono.trim() : '',
        role: 'ESTUDIANTE',
        paquete_adquirido: paquete,
        tipo_pago: esContado ? 'CONTADO' : 'CUOTAS',
        cuotas_pagadas: 1,
        cuotas_totales: numCuotasTotales,
        diplomado_1: dipTitulo,
        cupos_diplomados: 1,
        cupos_cursos: 0,
        diplomados: diplomadosSerialized,
        debe_cambiar_password: true,
        avance_porcentaje: 0,
        nota_promedio: 0,
        mes_inscripcion: new Date().toLocaleString('es-ES', { month: 'long' }),
        canal_adquisicion: 'Matrícula Manual Panel Admin'
      })
      .select()
      .single();

    if (profileErr) {
      console.error('Error insertando profile:', profileErr);
      return NextResponse.json({ error: \`Error creando perfil: \${profileErr.message}\` }, { status: 500 });
    }

    // 5. Crear cronograma inicial en public.pagos
    const cuotasArray = Array(6).fill('no corresponde');
    for (let i = 0; i < numCuotasTotales && i < 6; i++) {
      cuotasArray[i] = i === 0 ? String(montoCuotaNum) : '0';
    }

    const initialTotalPagado = montoCuotaNum;
    const initialDeuda = esContado ? 0 : Math.max(0, montoTotalNum - initialTotalPagado);

    const initialMetodo = \`CREDITO_1|\${JSON.stringify({
      num_credito: 1,
      cuotas: cuotasArray,
      total_pagado: initialTotalPagado,
      total_deuda: initialDeuda
    })}\`;

    try {
      await admin.from('pagos').insert({
        profile_id: studentId,
        dni_ce: normalizedDni,
        monto: montoTotalNum,
        metodo: initialMetodo,
        estado: initialDeuda === 0 ? 'Completado' : 'Pendiente'
      });
    } catch (pagErr) {
      console.error('Advertencia insertando pago:', pagErr);
    }

    // 6. Auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: 'CREAR_ESTUDIANTE_MANUAL',
        detalles: {
          studentId,
          dni_ce: normalizedDni,
          estudiante: \`\${nombres} \${apellidos}\`,
          email: normalizedEmail,
          paquete,
          tipo_pago: esContado ? 'CONTADO' : 'CUOTAS',
          diplomado_1: dipTitulo
        }
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({
      success: true,
      message: \`¡Estudiante \${nombres} \${apellidos} registrado exitosamente!\`,
      estudiante: newProfile
    });

  } catch (err: any) {
    console.error('Error en POST /api/admin/estudiantes:', err);
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
`;

  fs.writeFileSync(filePath, content + postFunction, 'utf8');
  console.log('POST añadido exitosamente a app/api/admin/estudiantes/route.ts');
} else {
  console.log('POST ya existe');
}
