-- Migración: Configuración de visibilidad de diplomados y cursos en el catálogo de estudiantes
-- Permite diferenciar entre programas públicos/elegibles por estudiantes y productos de uso exclusivamente interno.

ALTER TABLE public.diplomados_y_cursos 
ADD COLUMN IF NOT EXISTS mostrar_en_catalogo BOOLEAN DEFAULT true;

-- Asegurar que todos los productos existentes inicien visibles por defecto
UPDATE public.diplomados_y_cursos 
SET mostrar_en_catalogo = true 
WHERE mostrar_en_catalogo IS NULL;

COMMENT ON COLUMN public.diplomados_y_cursos.mostrar_en_catalogo IS 'Indica si el diplomado o curso se muestra en el catálogo público y de canje de estudiantes (true) o si es un producto interno no elegible (false)';
