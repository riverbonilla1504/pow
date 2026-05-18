/**
 * Configuración de la URL base de la API.
 * Maneja la diferencia entre producción (api.freck.lat) y desarrollo local (proxy).
 */

/** URL de la API en producción — siempre apunta a api.freck.lat */
export const API_ORIGIN = 'https://api.freck.lat';

/** Hostnames que se consideran desarrollo local */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

/** Verifica si el hostname corresponde a un entorno de desarrollo local */
export function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTS.has(hostname);
}

/**
 * Determina la URL base para las peticiones a la API.
 * - Producción: https://api.freck.lat
 * - Desarrollo local: /api/backend (rewrite en next.config) o variable de entorno
 * - SSR: usa la variable de entorno API_PROXY_TARGET o API_ORIGIN
 */
export function getApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

  // En el navegador (CSR)
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    // Desarrollo local con proxy de Next.js
    if (isLocalHostname(hostname) && fromEnv === '/api/backend') {
      return '/api/backend';
    }

    // Variable de entorno con URL absoluta
    if (fromEnv && fromEnv.startsWith('http')) {
      return fromEnv;
    }

    // Fallback: API de producción
    return API_ORIGIN;
  }

  // En el servidor (SSR): usa variable de entorno o API de producción
  if (fromEnv && fromEnv.startsWith('http')) {
    return fromEnv;
  }

  return (process.env.API_PROXY_TARGET || API_ORIGIN).replace(/\/$/, '');
}
