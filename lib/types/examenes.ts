export type TipoPregunta = 'multiple_choice' | 'multiple_select';
export type NivelDificultad = 'FACIL' | 'MEDIO' | 'ALTO';

export interface OpcionPregunta {
  text: string;
  isCorrect: boolean;
  rationale?: string;
}

export interface PreguntaBanco {
  id: string;
  codigo_diplomado: string;
  diplomado: string;
  modulo: string;
  dificultad: NivelDificultad | string;
  tipo: TipoPregunta;
  pregunta: string;
  opciones: OpcionPregunta[];
  hint?: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Estructura de pregunta enviada al estudiante durante la evaluación (sin isCorrect ni rationale) */
export interface PreguntaExamenEstudiante {
  id: string;
  codigo_diplomado: string;
  modulo: string;
  tipo: TipoPregunta;
  dificultad?: string;
  pregunta: string;
  opciones: {
    indice: number;
    text: string;
  }[];
  hint?: string | null;
}

export interface ExamenModuloConfig {
  id?: string;
  codigo_diplomado: string;
  modulo: string;
  titulo?: string;
  cantidad_preguntas: number;
  tiempo_minutos: number;
  nota_aprobatoria: number;
  puntaje_maximo: number;
  intentos_permitidos: number;
  activo: boolean;
}

export interface DetalleCalificacionPregunta {
  preguntaId: string;
  pregunta: string;
  tipo: TipoPregunta;
  opcionesMarcadas: number[];
  opcionesCorrectas: number[];
  esCorrecta: boolean;
  puntajeObtenido: number;
  puntajeMaximoPregunta: number;
  hint?: string | null;
  desgloseOpciones: {
    indice: number;
    text: string;
    isCorrect: boolean;
    marcadaPorAlumno: boolean;
    rationale?: string;
  }[];
}

export interface ResultadoEvaluacionExamen {
  intentoId?: string;
  nota: number;
  aprobado: boolean;
  notaAprobatoria: number;
  totalPreguntas: number;
  totalAciertos: number;
  detalles: DetalleCalificacionPregunta[];
}
