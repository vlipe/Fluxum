// src/lib/api.js
const API = import.meta.env.VITE_API_URL || "";

const storage = {
  get() {
    return localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
  },
  set(token, remember) {
    if (remember) {
      localStorage.setItem("accessToken", token);
      sessionStorage.removeItem("accessToken");
    } else {
      sessionStorage.setItem("accessToken", token);
      localStorage.removeItem("accessToken");
    }
  },
  clear() {
    localStorage.removeItem("accessToken");
    sessionStorage.removeItem("accessToken");
  },
  remembered() {
    return !!localStorage.getItem("accessToken");
  }
};

async function rawFetch(path, { method = "GET", body, headers = {}, auth = false, credentials = "include" } = {}) {
  const h = { ...(headers || {}) };
  if (!(body instanceof FormData) && !h["Content-Type"]) h["Content-Type"] = "application/json";
  if (auth) {
    const tok = storage.get();
    if (tok) h["Authorization"] = `Bearer ${tok}`;
  }
  const res = await fetch(`${API}${path}`, {
    method,
    headers: h,
    credentials, // importante p/ enviar cookies
    body: body ? (h["Content-Type"] === "application/json" ? JSON.stringify(body) : body) : undefined,
    cache: method === "GET" ? "no-store" : "no-cache"
  });
  let data = null;
  const ctype = res.headers.get("content-type") || "";
  if (ctype.includes("application/json")) {
    try { data = await res.clone().json(); } catch { data = null; }
  }
  return { res, data };
}

// tenta obter/accessToken se ainda não houver
async function ensureAccessToken() {
  if (storage.get()) return; // já tem
  const r = await fetch(`${API}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" }
  });
  const j = await r.json().catch(() => ({}));
  if (r.ok && j?.accessToken) {
    storage.set(j.accessToken, storage.remembered());
    return;
  }
  storage.clear();
}

export async function apiFetch(path, opts = {}) {
  // debug opcional
  if (typeof path === 'string' && /\/api\/users\/[^/]+\/avatar/.test(path)) {
    // eslint-disable-next-line no-console
    console.warn('[DEBUG avatar] Chamado:', path, '\nStack:\n', new Error().stack);
  }

  // se pedir auth, garanta token antes do 1º request
  if (opts.auth) {
    await ensureAccessToken();
  }

  let { res, data } = await rawFetch(path, opts);
  if (res.status !== 401) {
    if (!res.ok) throw new Error(data?.error || data?.message || "Erro na requisição");
    return data;
  }

  // 401 → tenta refresh e repete
  const r = await fetch(`${API}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" }
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j?.accessToken) {
    storage.clear();
    throw new Error("Sessão expirada");
  }
  storage.set(j.accessToken, storage.remembered());

  ({ res, data } = await rawFetch(path, opts));
  if (!res.ok) throw new Error(data?.error || data?.message || "Erro");
  return data;
}

export const TokenStorage = storage;
