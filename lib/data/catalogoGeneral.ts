import { ALL_DIPLOMADOS } from '@/lib/data/diplomadosData';
import cursosRaw from '@/lib/data/cursos.json';

export interface CatalogoDiplomadoItem {
  id: string;
  slug: string;
  numId: number;
  titulo: string;
  categoria: string;
  modulosCount: number;
  imagen: string;
  precioRegular: number;
  precioOferta: number;
}

export interface CatalogoCursoItem {
  id: number;
  codigo: string;
  titulo: string;
  categoria: string;
  duracion: string;
  horas: number;
  precio: number;
  imagen: string;
  nivel?: string;
  estado?: string;
  modulos?: any[];
  temas?: string[];
}

export const CATALOGO_DIPLOMADOS: CatalogoDiplomadoItem[] = ALL_DIPLOMADOS.map((d) => ({
  id: d.slug,
  slug: d.slug,
  numId: d.numId,
  titulo: d.titulo,
  categoria: d.categoria,
  modulosCount: d.modulosCount,
  imagen: d.imagen,
  precioRegular: d.precioRegular,
  precioOferta: d.precioOferta
}));

// Generar slug para imágenes de cursos
function slugifyCurso(t: string): string {
  return t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const CATALOGO_CURSOS: CatalogoCursoItem[] = (cursosRaw as any[]).map((c, index) => {
  const numId = c.id || (index + 1);
  const numStr = numId.toString().padStart(2, '0');
  const codigo = `CUR-${numStr}`;
  const slug = slugifyCurso(c.curso);

  return {
    id: numId,
    codigo,
    titulo: c.curso,
    categoria: c.categoria || 'Especialización',
    duracion: '25 Horas Académicas',
    horas: 25,
    precio: 99,
    imagen: `/assets/images/cursos/cur-${numStr}-${slug}.jpg`
  };
});
