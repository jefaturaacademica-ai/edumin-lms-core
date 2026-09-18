export const AVAILABLE_COURSES = [
  {
    id: "gestion-minera",
    name: "Gestión Minera",
    description: "Estrategias, planificación y sostenibilidad para la industria minera.",
    category: "Gestión",
  },
  {
    id: "seguridad-industrial",
    name: "Seguridad Industrial",
    description: "Prevención de riesgos y cultura de seguridad en operaciones críticas.",
    category: "Seguridad",
  },
  {
    id: "operaciones-de-planta",
    name: "Operaciones de Planta",
    description: "Optimiza procesos y toma decisiones en entornos operativos.",
    category: "Operaciones",
  },
] as const;

export type AvailableCourse = (typeof AVAILABLE_COURSES)[number];
