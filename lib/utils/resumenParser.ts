export interface TemaClaveItem {
  titulo: string;
  descripcion: string;
  texto: string;
}

export interface ResumenData {
  parrafo: string;
  temasClave: TemaClaveItem[];
  rawMarkdown?: string;
}

/**
 * Parsea el Markdown estructurado generado por NotebookLM:
 * 
 * **Resumen:**
 * [Párrafo pedagógico]
 * 
 * **Puntos clave:** (o **Temas clave:**)
 * - **Concepto:** Explicación
 */
export function parsearResumenTexto(texto?: string | null): ResumenData | null {
  if (!texto || typeof texto !== 'string' || !texto.trim()) return null;

  // Extraer párrafo de resumen y bloque de puntos/temas clave
  const resumenMatch = texto.match(/\*\*Resumen:\*\*\s*([\s\S]*?)(?=\*\*(?:Puntos|Temas)\s+clave:\*\*|$)/i);
  const temasMatch = texto.match(/\*\*(?:Puntos|Temas)\s+clave:\*\*\s*([\s\S]*?)(?=---|###|$)/i);

  const parrafo = resumenMatch ? resumenMatch[1].trim() : '';
  const lineasTemas = temasMatch 
    ? temasMatch[1].trim().split(/\r?\n/).filter(l => l.trim().startsWith('-'))
    : [];

  const temasClave: TemaClaveItem[] = lineasTemas.map(l => {
    const raw = l.trim().replace(/^-\s*/, '').trim();
    // Detecta tanto "**Termino:** Explicacion" como "**Termino**: Explicacion"
    const matchTerm = raw.match(/^\*\*(.*?)(?::)?\*\*(?::)?\s*([\s\S]*)$/);
    if (matchTerm) {
      return {
        titulo: matchTerm[1].trim(),
        descripcion: matchTerm[2].trim(),
        texto: `- **${matchTerm[1].trim()}:** ${matchTerm[2].trim()}`
      };
    }
    return {
      titulo: '',
      descripcion: raw,
      texto: `- ${raw}`
    };
  });

  if (!parrafo && temasClave.length === 0) return null;

  return {
    parrafo,
    temasClave,
    rawMarkdown: texto
  };
}
