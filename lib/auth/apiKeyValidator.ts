/**
 * Validador de claves de API (API Key) para endpoints externos v1.
 * Admite autenticación vía header 'x-api-key' o 'Authorization: Bearer <key>'.
 */

export const MASTER_FALLBACK_API_KEY = 'edumin_live_6cba7f9e1a2b3c4d5e6f8a9b0c1d2e3f';

export function getMasterApiKey(): string {
  const envKey = process.env.EDUMIN_API_KEY || process.env.N8N_API_SECRET_KEY;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }
  return MASTER_FALLBACK_API_KEY;
}

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

  const validKey = getMasterApiKey();

  if (tokenProporcionado !== validKey) {
    return {
      valid: false,
      error: 'Clave de API inválida o no autorizada.'
    };
  }

  return { valid: true };
}
