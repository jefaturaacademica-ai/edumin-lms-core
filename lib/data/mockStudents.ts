export interface EstudianteCompleto {
  id: string;
  dni_ce: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  paquete_adquirido: 'COMPLETO' | 'FULL' | 'ILIMITADO' | '100% CONTADO' | 'CONTADO' | string;
  cuotas_pagadas: number;
  cuotas_totales: number;
  monto_cuota: number;
  monto_total_programa?: number;
  monto_total_pagado: number;
  deuda_total_pendiente: number;
  cupos_diplomados: number;
  diplomado_actual: string;
  diplomado_2?: string;
  mes_inscripcion: string;
  estado: string;
  bloqueado: boolean;
  prorroga_hasta: string | null;
  solicitud_cip?: string;
  solicitud_datos?: string;
  // Métricas 360° Académicas, Marketing y Churn
  ultima_conexion: string;
  dias_inactivo: number;
  avance_porcentaje: number;
  modulos_completados?: number;
  modulos_totales?: number;
  nota_promedio: number;
  nivel_riesgo_churn: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO' | string;
  canal_adquisicion: string;
  historial_pagos?: any[];
  datos_solicitados?: {
    nombres_nuevos: string;
    apellidos_nuevos: string;
    dni_nuevo: string;
    sustento_url: string;
  };
  cronograma_pagos?: {
    cuota: number;
    monto: number;
    vencimiento: string;
    estado: 'PAGADO' | 'PENDIENTE' | 'VENCIDO' | string;
  }[];
}

export const MOCK_ESTUDIANTES: EstudianteCompleto[] = [
  {
    id: 'est-01',
    dni_ce: '76543210',
    nombres: 'Lucero',
    apellidos: 'Martinez',
    email: 'lucero.martinez@gmail.com',
    telefono: '+51 987654321',
    paquete_adquirido: 'COMPLETO',
    cuotas_pagadas: 1,
    cuotas_totales: 2,
    monto_cuota: 270.00,
    monto_total_pagado: 270.00,
    deuda_total_pendiente: 270.00,
    cupos_diplomados: 1,
    diplomado_actual: 'DERECHO MINERO',
    mes_inscripcion: 'agosto',
    estado: 'Deuda Activa',
    bloqueado: false,
    prorroga_hasta: null,
    solicitud_cip: 'Ninguna',
    solicitud_datos: 'Ninguna',
    ultima_conexion: 'Hace 3 días',
    dias_inactivo: 3,
    avance_porcentaje: 45,
    modulos_completados: 2,
    modulos_totales: 4,
    nota_promedio: 15.5,
    nivel_riesgo_churn: 'MEDIO',
    canal_adquisicion: 'Facebook Ads',
    cronograma_pagos: [
      { cuota: 1, monto: 270.00, vencimiento: '2026-08-15', estado: 'PAGADO' },
      { cuota: 2, monto: 270.00, vencimiento: '2026-09-15', estado: 'PENDIENTE' }
    ]
  },
  {
    id: 'est-02',
    dni_ce: '71234568',
    nombres: 'Marcos',
    apellidos: 'Quispe',
    email: 'marcos.q@hotmail.com',
    telefono: '+51 912345678',
    paquete_adquirido: 'FULL',
    cuotas_pagadas: 1,
    cuotas_totales: 3,
    monto_cuota: 300.00,
    monto_total_pagado: 300.00,
    deuda_total_pendiente: 600.00,
    cupos_diplomados: 2,
    diplomado_actual: 'GEOLOGÍA MINERA',
    mes_inscripcion: 'septiembre',
    estado: 'Prórroga Activa',
    bloqueado: false,
    prorroga_hasta: '2026-09-28',
    solicitud_cip: 'Ninguna',
    solicitud_datos: 'Ninguna',
    ultima_conexion: 'Hace 1 hora',
    dias_inactivo: 0,
    avance_porcentaje: 70,
    modulos_completados: 3,
    modulos_totales: 4,
    nota_promedio: 17.2,
    nivel_riesgo_churn: 'BAJO',
    canal_adquisicion: 'Google Search',
    cronograma_pagos: [
      { cuota: 1, monto: 300.00, vencimiento: '2026-08-01', estado: 'PAGADO' },
      { cuota: 2, monto: 300.00, vencimiento: '2026-09-01', estado: 'PENDIENTE' },
      { cuota: 3, monto: 300.00, vencimiento: '2026-10-01', estado: 'PENDIENTE' }
    ]
  },
  {
    id: 'est-03',
    dni_ce: '78912345',
    nombres: 'Ana',
    apellidos: 'Torres Valdivia',
    email: 'ana.torres@gmail.com',
    telefono: '+51 955443322',
    paquete_adquirido: 'COMPLETO',
    cuotas_pagadas: 0,
    cuotas_totales: 3,
    monto_cuota: 180.00,
    monto_total_pagado: 0.00,
    deuda_total_pendiente: 540.00,
    cupos_diplomados: 0,
    diplomado_actual: 'GERENCIA HSEQ',
    mes_inscripcion: 'julio',
    estado: 'Bloqueado por Sistema',
    bloqueado: true,
    prorroga_hasta: null,
    solicitud_cip: 'Ninguna',
    solicitud_datos: 'Ninguna',
    ultima_conexion: 'Hace 22 días',
    dias_inactivo: 22,
    avance_porcentaje: 10,
    modulos_completados: 0,
    modulos_totales: 4,
    nota_promedio: 10.0,
    nivel_riesgo_churn: 'CRÍTICO',
    canal_adquisicion: 'Facebook Ads',
    cronograma_pagos: [
      { cuota: 1, monto: 180.00, vencimiento: '2026-07-10', estado: 'VENCIDO' },
      { cuota: 2, monto: 180.00, vencimiento: '2026-08-10', estado: 'VENCIDO' },
      { cuota: 3, monto: 180.00, vencimiento: '2026-09-10', estado: 'VENCIDO' }
    ]
  },
  {
    id: 'est-04',
    dni_ce: '43210987',
    nombres: 'Carlos Eduardo',
    apellidos: 'Benavides Vargas',
    email: 'carlos.benavides@outlook.com',
    telefono: '+51 944332211',
    paquete_adquirido: 'ILIMITADO',
    cuotas_pagadas: 3,
    cuotas_totales: 3,
    monto_cuota: 500.00,
    monto_total_pagado: 1500.00,
    deuda_total_pendiente: 0.00,
    cupos_diplomados: 15,
    diplomado_actual: 'MINERÍA 4.0 Y DIGITALIZACIÓN',
    mes_inscripcion: 'julio',
    estado: 'Al Día',
    bloqueado: false,
    prorroga_hasta: null,
    solicitud_cip: 'Emitido',
    solicitud_datos: 'Ninguna',
    ultima_conexion: 'Hace 15 minutos',
    dias_inactivo: 0,
    avance_porcentaje: 95,
    modulos_completados: 5,
    modulos_totales: 5,
    nota_promedio: 18.8,
    nivel_riesgo_churn: 'BAJO',
    canal_adquisicion: 'WhatsApp Directo',
    cronograma_pagos: [
      { cuota: 1, monto: 500.00, vencimiento: '2026-06-01', estado: 'PAGADO' },
      { cuota: 2, monto: 500.00, vencimiento: '2026-07-01', estado: 'PAGADO' },
      { cuota: 3, monto: 500.00, vencimiento: '2026-08-01', estado: 'PAGADO' }
    ]
  },
  {
    id: 'est-05',
    dni_ce: '10987654',
    nombres: 'María Elena',
    apellidos: 'Delgado Prieto',
    email: 'maria.delgado@yahoo.es',
    telefono: '+51 933221100',
    paquete_adquirido: 'FULL',
    cuotas_pagadas: 1,
    cuotas_totales: 3,
    monto_cuota: 300.00,
    monto_total_pagado: 300.00,
    deuda_total_pendiente: 600.00,
    cupos_diplomados: 2,
    diplomado_actual: 'GESTIÓN LOGÍSTICA Y ALMACENES',
    mes_inscripcion: 'agosto',
    estado: 'Prórroga Vencida',
    bloqueado: false,
    prorroga_hasta: '2026-09-20',
    solicitud_cip: 'Ninguna',
    solicitud_datos: 'Ninguna',
    ultima_conexion: 'Hace 12 días',
    dias_inactivo: 12,
    avance_porcentaje: 30,
    modulos_completados: 1,
    modulos_totales: 4,
    nota_promedio: 13.0,
    nivel_riesgo_churn: 'ALTO',
    canal_adquisicion: 'Facebook Ads',
    cronograma_pagos: [
      { cuota: 1, monto: 300.00, vencimiento: '2026-07-20', estado: 'PAGADO' },
      { cuota: 2, monto: 300.00, vencimiento: '2026-08-20', estado: 'VENCIDO' },
      { cuota: 3, monto: 300.00, vencimiento: '2026-09-20', estado: 'PENDIENTE' }
    ]
  },
  {
    id: 'est-06',
    dni_ce: '45892301',
    nombres: 'Jorge Luis',
    apellidos: 'Ramos Morales',
    email: 'jorge.ramos@gmail.com',
    telefono: '+51 922110099',
    paquete_adquirido: 'FULL',
    cuotas_pagadas: 3,
    cuotas_totales: 3,
    monto_cuota: 300.00,
    monto_total_pagado: 900.00,
    deuda_total_pendiente: 0.00,
    cupos_diplomados: 5,
    diplomado_actual: 'SEGURIDAD Y SALUD OCUPACIONAL',
    mes_inscripcion: 'septiembre',
    estado: 'Al Día',
    bloqueado: false,
    prorroga_hasta: null,
    solicitud_cip: 'Pendiente',
    solicitud_datos: 'Ninguna',
    ultima_conexion: 'Hace 4 horas',
    dias_inactivo: 0,
    avance_porcentaje: 88,
    modulos_completados: 4,
    modulos_totales: 4,
    nota_promedio: 16.8,
    nivel_riesgo_churn: 'BAJO',
    canal_adquisicion: 'Recomendación',
    cronograma_pagos: [
      { cuota: 1, monto: 300.00, vencimiento: '2026-06-10', estado: 'PAGADO' },
      { cuota: 2, monto: 300.00, vencimiento: '2026-07-10', estado: 'PAGADO' },
      { cuota: 3, monto: 300.00, vencimiento: '2026-08-10', estado: 'PAGADO' }
    ]
  },
  {
    id: 'est-07',
    dni_ce: '73412098',
    nombres: 'Sofía Beatriz',
    apellidos: 'Mendoza Ugarte',
    email: 'sofia.mendoza@gmail.com',
    telefono: '+51 911009988',
    paquete_adquirido: 'COMPLETO',
    cuotas_pagadas: 2,
    cuotas_totales: 2,
    monto_cuota: 270.00,
    monto_total_pagado: 540.00,
    deuda_total_pendiente: 0.00,
    cupos_diplomados: 3,
    diplomado_actual: 'GEOMECÁNICA SUBTERRÁNEA',
    mes_inscripcion: 'septiembre',
    estado: 'Al Día',
    bloqueado: false,
    prorroga_hasta: null,
    solicitud_cip: 'Ninguna',
    solicitud_datos: 'Pendiente',
    ultima_conexion: 'Hace 1 día',
    dias_inactivo: 1,
    avance_porcentaje: 65,
    modulos_completados: 2,
    modulos_totales: 3,
    nota_promedio: 17.0,
    nivel_riesgo_churn: 'BAJO',
    canal_adquisicion: 'Google Search',
    datos_solicitados: {
      nombres_nuevos: 'Sofía Beatriz',
      apellidos_nuevos: 'Mendoza de Ugarte',
      dni_nuevo: '73412098',
      sustento_url: '/assets/docs/dni_sofia_mendoza.pdf'
    },
    cronograma_pagos: [
      { cuota: 1, monto: 270.00, vencimiento: '2026-07-05', estado: 'PAGADO' },
      { cuota: 2, monto: 270.00, vencimiento: '2026-08-05', estado: 'PAGADO' }
    ]
  }
];
