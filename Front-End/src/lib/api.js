import { AuthAPI } from "./auth";
// src/lib/api.js
export const API_BASE = import.meta.env.VITE_API_URL || "";

export async function apiFetch(path, opts = {}) {
  const base = API_BASE;
  const method = (opts.method || "GET").toUpperCase();

  const res = await fetch(base + path, {
    credentials: "include",
    cache: method === "GET" ? "no-store" : "no-cache",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
    method,
  });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try { msg = (await res.json()).error || msg; } catch(err) {console.warn(err)}
    throw new Error(msg);
  }
  return res.status === 204 ? null : res.json();
}
