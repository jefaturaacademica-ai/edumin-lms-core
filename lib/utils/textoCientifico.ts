import React from 'react';

/**
 * Utilidad para transformar notación científica, química y matemática (LaTeX)
 * a texto natural, fluido y tipográficamente elegante en español,
 * además de renderizar cursivas Markdown (*término*) como etiquetas <em> reales.
 */

const subindicesMap: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋'
};

const superindicesMap: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻'
};

export function limpiarTextoCientificoPlano(texto?: string | null): string {
  if (!texto || typeof texto !== 'string') return '';

  return texto
    // 1. Coma decimal de LaTeX: 8{,}0 -> 8,0
    .replace(/(\d+)\{,\}(\d+)/g, '$1,$2')

    // 2. Magnitud sísmica de momento M_w o M_W -> Mw
    .replace(/\bM_w\b/gi, 'Mw')

    // 3. Rangos tipográficos: \text{--} o \text{-} -> ' – '
    .replace(/\\text\{--\}/g, ' – ')
    .replace(/\\text\{-\}/g, '-')

    // 4. Temperaturas en grados Celsius: \,^\circ\text{C} o ^\circ\text{C} -> ' °C'
    .replace(/\s*\\,\s*\^\\circ\s*\\text\{C\}/g, ' °C')
    .replace(/\s*\^\\circ\s*\\text\{C\}/g, ' °C')
    .replace(/\^\{\\circ\}/g, '°')
    .replace(/\^\\circ/g, '°')

    // 5. Porcentajes y operadores matemáticos LaTeX: \% -> %, \times -> ×, \cdot -> ·
    .replace(/\\%/g, '%')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')

    // 6. Superíndices químicos (ej: Fe^{2+} -> Fe²⁺, ^2 -> ², ^3 -> ³)
    .replace(/\^\{([0-9\+\-]+)\}/g, (_, p1) => p1.split('').map((c: string) => superindicesMap[c] || c).join(''))
    .replace(/\^([0-9\+\-])/g, (_, p1) => superindicesMap[p1] || p1)

    // 7. Subíndices químicos y de fórmulas (ej: CaMg(CO_3)_2 -> CaMg(CO₃)₂, SO_2 -> SO₂)
    .replace(/_\{([0-9\+\-]+)\}/g, (_, p1) => p1.split('').map((c: string) => subindicesMap[c] || c).join(''))
    .replace(/_([0-9])/g, (_, p1) => subindicesMap[p1] || p1)

    // 8. \text{palabra} -> palabra
    .replace(/\\text\{([^}]+)\}/g, '$1')

    // 9. Letras griegas comunes en minería y geología: \mu -> µ (micrones), \alpha -> α, \beta -> β
    .replace(/\\mu/g, 'µ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\Delta/g, 'Δ')

    // 10. Espaciadores LaTeX
    .replace(/\\[,;]/g, ' ')
    .replace(/\\quad/g, ' ')

    // 11. Eliminar delimitadores de fórmula $...$
    .replace(/\$([^$]+)\$/g, '$1')

    // 12. Limpieza de espacios redundantes y pegados de unidad
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([°%])/g, '$1')
    .trim();
}

export function formatearTextoCientifico(texto?: string | null): React.ReactNode {
  const limpio = limpiarTextoCientificoPlano(texto);
  if (!limpio) return '';

  // Si no contiene asteriscos de cursiva (*término*), devolver string directo
  if (!/\*([^*]+)\*/.test(limpio)) {
    return limpio;
  }

  // Dividir por *término* y convertir los segmentos impares en <em>cursiva</em>
  const partes = limpio.split(/\*([^*]+)\*/g);
  return partes.map((parte, idx) =>
    idx % 2 === 1
      ? React.createElement('em', { key: idx, className: 'italic' }, parte)
      : parte
  );
}
