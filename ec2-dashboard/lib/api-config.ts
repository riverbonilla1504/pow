/** API REST — siempre en api.freck.lat (nunca en freck.lat / admin.freck.lat). */
export const API_ORIGIN = 'https://api.freck.lat';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTS.has(hostname);
}

/**
 * Base URL para fetch del cliente / SSR.
 * - Producción (freck.lat, admin.freck.lat): https://api.freck.lat
 * - Dev local: /api/backend (rewrite en next.config) o API_ORIGIN si CORS lo permite
 */
export function getApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    if (isLocalHostname(hostname) && fromEnv === '/api/backend') {
      return '/api/backend';
    }

    if (fromEnv && fromEnv.startsWith('http')) {
      return fromEnv;
    }

    return API_ORIGIN;
  }

  if (fromEnv && fromEnv.startsWith('http')) {
    return fromEnv;
  }

  return (process.env.API_PROXY_TARGET || API_ORIGIN).replace(/\/$/, '');
}
