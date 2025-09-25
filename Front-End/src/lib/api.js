import { AuthAPI } from "./auth";
const API_BASE = import.meta.env.VITE_API_URL || "";

export async function apiFetch(path, opts = {}) {
  const { method = "GET", headers = {}, body, auth = true } = opts;
  const url = `${API_BASE}${path}`;
  const h = { "Content-Type": "application/json", ...headers };

  if (auth) {
    try {
      const token = typeof AuthAPI?.getToken === "function" ? AuthAPI.getToken() : null;
      if (token) h["Authorization"] = `Bearer ${token}`;
    } catch (e) { void e; }
  }

  const res = await fetch(url, {
    method,
    headers: h,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  const ct = res.headers.get("Content-Type") || "";
  const isJson = ct.includes("application/json");
  const data = isJson ? await res.json().catch(() => ({})) : null;

  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
