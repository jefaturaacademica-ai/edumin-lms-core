/**
 * Validador de claves de API (API Key) para endpoints externos v1.
 * Admite autenticación vía header 'x-api-key' o 'Authorization: Bearer <key>'.
 */
export function validarApiKey(request: Request): { valid: boolean; error?: string } {
  const xApiKey = request.headers.get('x-api-key');
  const authHeader = request.headers.get('authorization');

  let tokenProporcionado = xApiKey;
  if (!tokenProporcionado && authHeader && authHeader.startsWith('Bearer ')) {
    tokenProporcionado = authHeader.substring(7).trim();
  }

  if (!tokenProporcionado) {
    return {
      valid: false,
      error: 'Se requiere una clave de API válida. Proporciónela en el encabezado x-api-key o Authorization: Bearer <key>.'
    };
  }

  const validKey = process.env.EDUMIN_API_KEY || process.env.N8N_API_SECRET_KEY;

  if (!validKey) {
    // Si no estuviera configurada en el entorno, bloquea por seguridad
    return {
      valid: false,
      error: 'Servidor no configurado con una clave de API maestra.'
    };
  }

  if (tokenProporcionado !== validKey) {
    return {
      valid: false,
      error: 'Clave de API inválida o no autorizada.'
    };
  }

  return { valid: true };
}
