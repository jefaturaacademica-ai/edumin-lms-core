<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas de Interfaz y Estilo del LMS EDUMIN

## 1. Capitalización Estricta (Sentence case en Español)
- **SIEMPRE** usar formato tipo oración (*Sentence case*) para todas las etiquetas, títulos, botones, modales, placeholders y textos de la interfaz en español.
- Solo la primera letra de la frase o etiqueta se escribe en mayúscula (ej. "Departamento y ciudad", "País de residencia", "Número de celular", "Fecha de nacimiento", "Datos de contacto").
- **NUNCA** usar formato título en inglés (*Title Case*) con múltiples palabras en mayúscula dentro de una etiqueta en español (ej. NO usar "Departamento y Ciudad", NO usar "Número de Celular", NO usar "Datos de Contacto").
- Solo se escriben en mayúscula los nombres propios (ej. Perú, Lima) y las siglas institucionales o bancarias (ej. DNI, BCP, BBVA, LMS, EDUMIN).

## 2. Arquitectura de Pagos y Contratos
- En la tabla `pagos`, cada fila representa un contrato de crédito (o un cargo extra).
- Los números de recibo (`nro_recibo`) y de operación bancaria (`nro_operacion`) pertenecen a cada cuota/transacción individual y se gestionan exclusivamente dentro del JSON `cuotas_recibos`, nunca como columnas desnormalizadas en la fila padre.

