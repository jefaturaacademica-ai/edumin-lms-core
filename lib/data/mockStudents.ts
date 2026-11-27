import type { EstudianteCompleto } from '@/lib/types/estudiante';

export type { EstudianteCompleto };

/**
 * Array de mocks conservado por compatibilidad legacy.
 * Todos los datos activos ahora provienen dinámicamente de Supabase.
 */
export const MOCK_ESTUDIANTES: EstudianteCompleto[] = [];
