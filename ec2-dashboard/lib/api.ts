const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.freck.lat';

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(/(?:^|; )token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export function setToken(token: string) {
  document.cookie = `token=${encodeURIComponent(token)};path=/;max-age=3600;SameSite=Lax`;
}

export function clearToken() {
  document.cookie = 'token=;path=/;max-age=0';
}

export function hasToken(): boolean {
  return !!getToken();
}

async function req<T>(path: string, opts: RequestInit = {}, token?: string): Promise<T> {
  const t = token ?? getToken();
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...opts.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Auth
export const login = (email: string, password: string) =>
  req<any>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (email: string, password: string, phone?: string) =>
  req<any>('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, phone }) });

export const verify2fa = (code: string, tempToken: string) =>
  req<any>('/auth/2fa/verify', { method: 'POST', body: JSON.stringify({ code, tempToken }) });

export const enroll2fa = () =>
  req<any>('/auth/2fa/enroll', { method: 'POST' });

export const confirm2fa = (code: string) =>
  req<any>('/auth/2fa/confirm', { method: 'POST', body: JSON.stringify({ code }) });

export function getTokenPayload(): any {
  const t = getToken();
  if (!t) return null;
  try {
    const payload = t.split('.')[1];
    return JSON.parse(atob(payload));
  } catch { return null; }
}

// User — orders
export const myOrders = () => req<any>('/orders');
export const createOrder = (items: any[], total: number) =>
  req<any>('/orders', { method: 'POST', body: JSON.stringify({ items, total }) });

// Admin
export const adminDashboard = () => req<any>('/admin/dashboard');
export const adminOrders = (page = 1, limit = 15, status?: string) =>
  req<any>(`/admin/orders?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`);
export const adminNotifications = (page = 1, limit = 20, type?: string, status?: string) => {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (type)   params.set('type', type);
  if (status) params.set('status', status);
  return req<any>(`/admin/notifications?${params}`);
};
export const adminDLQ = () => req<any>('/admin/dlq');
export const adminUsers = (page = 1, limit = 20) =>
  req<any>(`/admin/users?page=${page}&limit=${limit}`);
export const updateRole = (id: string, role: string) =>
  req<any>(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) });
