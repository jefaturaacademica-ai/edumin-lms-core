export interface EstudianteCompleto {
  id: string;
  dni_ce: string;
  numero_documento?: string;
  tipo_documento?: 'DNI' | 'CE' | 'PASAPORTE' | 'OTRO' | string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  foto_perfil?: string | null;
  paquete_adquirido: 'COMPLETO' | 'FULL' | 'ILIMITADO' | '100% CONTADO' | 'CONTADO' | string;
  cuotas_pagadas: number;
  cuotas_totales: number;
  monto_cuota: number;
  monto_total_programa?: number;
  monto_total_pagado: number;
  deuda_total_pendiente: number;
  cupos_diplomados?: number;
  cupos_creditos?: any;
  diplomado_actual: string;
  diplomado_2?: string;
  mes_inscripcion: string | null;
  estado: string;
  bloqueado: boolean;
  prorroga_hasta: string | null;
  role?: string;
  roles?: {
    administrativo?: string | null;
    academico?: string | null;
  } | null;
  creditos?: any[];
  solicitud_cip?: string;
  solicitud_datos?: string;
  // Métricas 360° Académicas, Marketing y Churn
  ultima_conexion?: string | null;
  dias_inactivo?: number | null;
  avance_porcentaje: number;
  modulos_completados?: number;
  modulos_totales?: number;
  nota_promedio: number;
  nivel_riesgo_churn: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRÍTICO' | string;
  canal_adquisicion?: string | null;
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
