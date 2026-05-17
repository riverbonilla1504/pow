import Cookies from 'js-cookie';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://api.freck.lat';

function getToken() {
  return Cookies.get('admin_token') || '';
}

async function request(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),

  verify2fa: (token: string, code: string) =>
    request('/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
      headers: { Authorization: `Bearer ${token}` },
    }),

  dashboard: () => request('/admin/dashboard'),
  orders: (page = 1, status?: string) =>
    request(`/admin/orders?page=${page}${status ? `&status=${status}` : ''}`),
  notifications: (page = 1) => request(`/admin/notifications?page=${page}`),
  dlq: () => request('/admin/dlq'),
  users: () => request('/admin/users'),
  updateRole: (id: string, role: string) =>
    request(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  setToken: (token: string) => Cookies.set('admin_token', token, { expires: 1 }),
  clearToken: () => Cookies.remove('admin_token'),
  hasToken: () => !!Cookies.get('admin_token'),
};
