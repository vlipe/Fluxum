import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

export default function ConnectionBadge({ intervalMs = 30000 }) {
  const [ok, setOk] = useState(null);
  const [ts, setTs] = useState(null);

  async function ping() {
    try {
      const r = await apiFetch("/api/health");
      setOk(Boolean(r?.ok));
      setTs(r?.ts || new Date().toISOString());
    } catch {
      setOk(false);
      setTs(null);
    }
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!alive) return;
      await ping();
    })();
    const id = setInterval(ping, intervalMs);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [intervalMs]);

  const color = ok === null ? "bg-gray-400" : ok ? "bg-green-500" : "bg-red-500";
  const text = ok === null ? "Testando..." : ok ? "Conectado" : "Sem conexão";

  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 bg-white">
      <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-sm text-slate-700">{text}</span>
      {ts && ok && <span className="text-xs text-slate-400">• {new Date(ts).toLocaleTimeString()}</span>}
    </div>
  );
}
