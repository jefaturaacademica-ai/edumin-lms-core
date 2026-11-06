export type TipoRol = 'ADMINISTRATIVO' | 'ACADEMICO';

export interface SidebarModuloItem {
  href: string;
  label: string;
  iconName?: string;
}

export interface SidebarCategoriaModulo {
  idBloque: string;
  categoria: string;
  items: SidebarModuloItem[];
}

export interface RolePermisoDefinicion {
  id: string; // ej. 'SUPERADMIN', 'ADMIN', 'FINANCIERO', 'COORDINADOR'
  nombre: string;
  tipo: TipoRol;
  descripcion: string;
  esSistema: boolean; // Roles base que no se pueden eliminar
  color: string; // 'purple' | 'indigo' | 'emerald' | 'amber' | 'blue' | 'rose'
  modulosPermitidos: string[]; // Lista de hrefs permitidos, ej: ['/admin', '/admin/estudiantes']
}

// Estructura oficial de los módulos y bloques del Sidebar de EDUMIN
export const SIDEBAR_MODULOS_EDUMIN: SidebarCategoriaModulo[] = [
  {
    idBloque: 'bloque_academico',
    categoria: 'Gestión académica',
    items: [
      { href: '/admin/catalogo', label: 'Catálogo y programas' },
      { href: '/admin/examenes', label: 'Evaluaciones y notas' },
      { href: '/admin/estudiantes', label: 'Directorio de estudiantes' },
      { href: '/admin/certificaciones', label: 'Certificaciones CIP y diplomas' }
    ]
  },
  {
    idBloque: 'bloque_finanzas',
    categoria: 'Finanzas y retención',
    items: [
      { href: '/admin', label: 'Dashboard y finanzas 360°' },
      { href: '/admin/alumnos-riesgo', label: 'Alumnos en riesgo (deserción)' }
    ]
  },
  {
    idBloque: 'bloque_informes',
    categoria: 'Informes y datos',
    items: [
      { href: '/admin/reportes', label: 'Reportes y exportaciones CSV' }
    ]
  },
  {
    idBloque: 'bloque_sistema',
    categoria: 'Sistema y seguridad',
    items: [
      { href: '/admin/auditoria', label: 'Auditoría y webhooks n8n' },
      { href: '/admin/configuracion', label: 'Configuración y roles (RBAC)' }
    ]
  }
];

// Roles predefinidos del sistema EDUMIN
export const ROLES_PREDEFINIDOS: Record<string, RolePermisoDefinicion> = {
  SUPERADMIN: {
    id: 'SUPERADMIN',
    nombre: 'Superadministrador',
    tipo: 'ADMINISTRATIVO',
    descripcion: 'Acceso total y sin restricciones a todos los módulos y bloques del panel de administración.',
    esSistema: true,
    color: 'purple',
    modulosPermitidos: [
      '/admin/catalogo',
      '/admin/examenes',
      '/admin/estudiantes',
      '/admin/certificaciones',
      '/admin',
      '/admin/alumnos-riesgo',
      '/admin/reportes',
      '/admin/auditoria',
      '/admin/configuracion'
    ]
  },
  ADMIN: {
    id: 'ADMIN',
    nombre: 'Administrador',
    tipo: 'ADMINISTRATIVO',
    descripcion: 'Acceso a los bloques de gestión académica, finanzas y retención, e informes y datos.',
    esSistema: true,
    color: 'indigo',
    modulosPermitidos: [
      '/admin/catalogo',
      '/admin/examenes',
      '/admin/estudiantes',
      '/admin/certificaciones',
      '/admin',
      '/admin/alumnos-riesgo',
      '/admin/reportes'
    ]
  },
  FINANCIERO: {
    id: 'FINANCIERO',
    nombre: 'Financiero',
    tipo: 'ADMINISTRATIVO',
    descripcion: 'Acceso restringido exclusivamente al bloque de finanzas y retención de alumnos.',
    esSistema: true,
    color: 'emerald',
    modulosPermitidos: [
      '/admin',
      '/admin/alumnos-riesgo'
    ]
  },
  ESTUDIANTE: {
    id: 'ESTUDIANTE',
    nombre: 'Estudiante',
    tipo: 'ACADEMICO',
    descripcion: 'Acceso al campus virtual, diplomados inscritos, cursos y cronograma de cuotas.',
    esSistema: true,
    color: 'blue',
    modulosPermitidos: ['/dashboard']
  },
  DOCENTE: {
    id: 'DOCENTE',
    nombre: 'Docente',
    tipo: 'ACADEMICO',
    descripcion: 'Acceso académico al módulo de dictado docente y registro de notas (configuración posterior).',
    esSistema: true,
    color: 'amber',
    modulosPermitidos: []
  }
};
