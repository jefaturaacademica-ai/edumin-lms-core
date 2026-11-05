export interface PaqueteDefinicion {
  id: string; // ej: 'COMPLETO', 'FULL', 'ILIMITADO', 'BECA', 'CORPORATIVO'
  nombre: string;
  descripcion: string;
  precioContado: number;
  precioCuotas: number;
  cuotasSugeridas: number;
  creditosDiplomados: number;
  creditosCursos: number;
  modulares: number;
  diplomas: number;
  certCip: boolean;
  certInternacional?: boolean; // Certificación Internacional (Full e Ilimitado)
  bolsaTrabajoRegular?: boolean; // Bolsa Regular (Completo, Full, Ilimitado)
  bolsaTrabajoExclusiva?: boolean; // Bolsa Exclusiva (Full, Ilimitado)
  dreambuilder?: boolean; // Portal Dreambuilder (los 3 por defecto)
  esPersonalizado?: boolean;
  colorTag?: string; // ej: 'indigo', 'amber', 'purple', 'emerald'
}

export const PAQUETES_DEFAULT: Record<string, PaqueteDefinicion> = {
  COMPLETO: {
    id: 'COMPLETO',
    nombre: 'Paquete COMPLETO',
    descripcion: 'Reglas de emisión y límites de cursos para alumnos matriculados en modalidad Completo.',
    precioContado: 540,
    precioCuotas: 540,
    cuotasSugeridas: 3,
    creditosDiplomados: 1,
    creditosCursos: 3,
    modulares: 3,
    diplomas: 1,
    certCip: false,
    certInternacional: false,
    bolsaTrabajoRegular: true,
    bolsaTrabajoExclusiva: false,
    dreambuilder: true,
    esPersonalizado: false,
    colorTag: 'indigo'
  },
  FULL: {
    id: 'FULL',
    nombre: 'Paquete FULL',
    descripcion: 'Incluye más cursos libres y derecho a certificación digital del Colegio de Ingenieros.',
    precioContado: 900,
    precioCuotas: 900,
    cuotasSugeridas: 3,
    creditosDiplomados: 1,
    creditosCursos: 5,
    modulares: 3,
    diplomas: 1,
    certCip: true,
    certInternacional: true,
    bolsaTrabajoRegular: true,
    bolsaTrabajoExclusiva: true,
    dreambuilder: true,
    esPersonalizado: false,
    colorTag: 'amber'
  },
  ILIMITADO: {
    id: 'ILIMITADO',
    nombre: 'Paquete ILIMITADO',
    descripcion: 'Progresión ilimitada por bloques con aprobación directa de módulos.',
    precioContado: 1500,
    precioCuotas: 1500,
    cuotasSugeridas: 5,
    creditosDiplomados: 3,
    creditosCursos: 15,
    modulares: 10,
    diplomas: 5,
    certCip: true,
    certInternacional: true,
    bolsaTrabajoRegular: true,
    bolsaTrabajoExclusiva: true,
    dreambuilder: true,
    esPersonalizado: false,
    colorTag: 'purple'
  }
};
