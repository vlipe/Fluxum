// src/lib/auth.js


//VITE_API_URL=http://localhost:3000 (ou /api)
const API = import.meta.env.VITE_API_URL || '';


const storage = {
  get() {
    return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  },
  set(token, remember) {
    if (remember) {
      localStorage.setItem('accessToken', token);
      sessionStorage.removeItem('accessToken');
    } else {
      sessionStorage.setItem('accessToken', token);
      localStorage.removeItem('accessToken');
    }
  },
  clear() {
    localStorage.removeItem('accessToken');
    sessionStorage.removeItem('accessToken');
  },
  remembered() {
    return !!localStorage.getItem('accessToken');
  }
};


async function rawFetch(path, { method = 'GET', body, headers = {}, auth = false } = {}) {
  const h = { ...(headers || {}) };

 
  if (!(body instanceof FormData) && !h['Content-Type']) {
    h['Content-Type'] = 'application/json';
  }
  if (auth) {
    const tok = storage.get();
    if (tok) h['Authorization'] = `Bearer ${tok}`;
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers: h,
    body: body
      ? (h['Content-Type'] === 'application/json' ? JSON.stringify(body) : body)
      : undefined
  });

  
  let data = null;
  const ctype = res.headers.get('content-type') || '';
  if (ctype.includes('application/json')) {
    try { data = await res.clone().json(); } catch { data = null; }
  }

  return { res, data };
}


export async function apiFetch(path, opts = {}) {
  
  let { res, data } = await rawFetch(path, opts);

  if (res.status !== 401) {
    if (!res.ok) throw new Error(data?.error || data?.message || 'Erro na requisição');
    return data;
  }


  const r = await fetch(`${API}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.accessToken) {
    storage.clear();
    throw new Error('Sessão expirada');
  }


  storage.set(j.accessToken, storage.remembered());

 
  ({ res, data } = await rawFetch(path, opts));
  if (!res.ok) throw new Error(data?.error || data?.message || 'Erro');
  return data;
}


export const AuthAPI = {
  async register({ name, email, password }) {
  const data = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: { name, email, password }
  });
  
  return data;
},


  async login({ email, password }, remember) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    });
    if (data?.accessToken) storage.set(data.accessToken, remember);
    return data;
  },

  async me() {
    return apiFetch(`/api/users/me?ts=${Date.now()}`, { auth: true });
  },

  async logout() {
    storage.clear();
    await fetch(`${API}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  getToken: storage.get,
  clearToken: storage.clear,
};
