// src/Pages/Relatorios.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import Sidebar2 from "../Components/Sidebar2";
import Pesquisa from "../assets/assetsAlertas/pesquisar.svg";
import Grafico from "../assets/assetsRelatorios/grafico.svg";
import Horario from "../assets/assetsRelatorios/horario.svg";
import { apiFetch, TokenStorage } from "../lib/api";





function formatDateISOToBR(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString();
  } catch {
    return iso ?? "";
  }
}


function useSummary() {
  const [data, setData] = useState({ totalMovements: 0, avgDeliveryDays: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`/api/reports/summary`, { auth: true });
        if (alive && res) setData(res);
      } catch (e) {
        console.error("summary:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { ...data, loading };
}

/** Alertas por mês (do grafico) */
function useAlertsByMonth(months = 6) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFetch(`/api/reports/alerts-by-month?months=${months}`, { auth: true });
        const safe = Array.isArray(res) ? res : [];
        if (alive) setRows(safe);
      } catch (e) {
        console.error("alerts-by-month:", e);
        if (alive) setRows([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [months]);
  return { rows, loading };
}

function useContainersTable(search, page = 1, pageSize = 20) {
  const [state, setState] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const qs = new URLSearchParams({
          search: search || "",
          page: String(page),
          pageSize: String(pageSize),
        });
        const res = await apiFetch(`/api/reports/containers?` + qs.toString(), { auth: true });

        const safeItems = Array.isArray(res?.items) ? res.items : [];
        const safeTotal = Number.isFinite(res?.total) ? res.total : 0;

        if (alive) setState({ items: safeItems, total: safeTotal });
      } catch (e) {
        console.error("containers:", e);
        if (alive) setState({ items: [], total: 0 });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [search, page, pageSize]);

  return { ...state, loading };
}

/** Componente: gráfico de barras simples (usa altura dinâmica via inline style) */
const AlertasChart = () => {
  const { rows, loading } = useAlertsByMonth(6);

  const chartData = useMemo(() => {
    const r = Array.isArray(rows) ? rows : [];
    if (!r.length) return [];
    const max = Math.max(1, ...r.map((x) => x.count || 0));
    const nomes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

    return r.map((x) => {
      const [, mm] = String(x.month || "").split("-");
      const label = nomes[(Number(mm || 1) - 1 + 12) % 12] || x.month;
      const h = Math.max(24, Math.round(200 * ((x.count || 0) / max))); // px
      return { month: label, heightPx: h, value: x.count || 0 };
    });
  }, [rows]);

  return (
    <div className="bg-[#F2F6FB] p-6 rounded-3xl h-full flex flex-col">
      <p className="text-sm text-azulEscuro font-medium">Alertas registrados</p>

      {loading ? (
        <div className="flex-1 grid place-items-center text-xs text-gray-500">Carregando...</div>
      ) : chartData.length === 0 ? (
        <div className="flex-1 grid place-items-center text-xs text-gray-500">Sem dados</div>
      ) : (
        <div className="flex-1 flex items-end justify-center gap-4 mt-4">
          {chartData.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2">
              <div
                className="w-10 sm:w-12 bg-[#9F9CE8] rounded-xl"
                style={{ height: `${item.heightPx}px` }}
                title={`${item.value} alertas`}
              />
              <span className="text-xs text-gray-500">{item.month}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Relatorios = () => {
  const [pesquisa, setPesquisa] = useState("");
  const { totalMovements, avgDeliveryDays } = useSummary();
  const { items, loading } = useContainersTable(pesquisa, 1, 20);
  const rows = Array.isArray(items) ? items : [];

  const getStatusClass = (status) => {
    switch (status) {
      case "Atrasado":
        return "text-[#F21D4E]";
      case "Em trânsito":
        return "text-[#3E41C0]";
      default:
        return "text-gray-500";
    }
  };

  const onExportPDF = useCallback(async () => {
  const base = import.meta.env.VITE_API_URL || "";

  const doFetch = async () => {
    const tok = TokenStorage.get();
    return fetch(base + "/api/reports/export", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(tok ? { Authorization: `Bearer ${tok}` } : {}),
      },
      body: JSON.stringify({ search: pesquisa, pageSize: 20 }),
    });
  };

  let res = await doFetch();

  if (res.status === 401) {
    const r = await fetch(base + "/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.accessToken) {
      TokenStorage.set(j.accessToken, TokenStorage.remembered());
      res = await doFetch();
    }
  }

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    alert(`Falha ao exportar PDF (${res.status}). ${txt}`);
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "relatorio-fluxum.pdf";
  a.click();
  URL.revokeObjectURL(url);
}, [pesquisa]);


  return (
    <div className="min-h-screen w-full bg-[#F2F6FB] flex">
      <Sidebar2 />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-[760px]:mt-16">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="relative flex-1 max-w-full sm:max-w-4xl max-[760px]:hidden">
            <input
              type="text"
              placeholder="Pesquisar por palavra-chave..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="w-full h-12 rounded-3xl bg-white pl-16 pr-4 text-sm focus:outline-none shadow-sm"
            />
            <img
              src={Pesquisa}
              alt="Pesquisar"
              className="w-5 h-5 absolute ml-6 top-1/2 -translate-y-1/2 pointer-events-none"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl font-bold font-GT text-azulEscuro">Relatórios</h1>
            <button
              onClick={onExportPDF}
              className="bg-[#ECF2F9] text-azulEscuro font-medium rounded-2xl py-2 px-5 text-xs hover:bg-white duration-300"
            >
              Exportar PDF
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
            <div className="lg:col-span-3 flex flex-col gap-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-[#F2F6FB] p-6 rounded-3xl">
                  <p className="text-sm text-azulEscuro font-medium">Total de cargas movimentadas</p>
                  <div className="flex justify-between items-end mt-4">
                    <p className="text-4xl lg:text-5xl font-GT font-bold text-[#3E41C0]">
                      {totalMovements?.toLocaleString?.() ?? totalMovements}
                    </p>
                    <img src={Grafico} alt="Gráfico" className="w-16 h-16" />
                  </div>
                </div>
                <div className="bg-[#F2F6FB] p-6 rounded-3xl">
                  <p className="text-sm text-azulEscuro font-medium">Tempo médio de entrega</p>
                  <div className="flex justify-between items-end mt-4">
                    <p className="text-4xl lg:text-5xl font-GT font-bold text-[#3E41C0]">
                      {avgDeliveryDays} dias
                    </p>
                    <img src={Horario} alt="Horário" className="w-16 h-16" />
                  </div>
                </div>
              </div>

              {/* Tabela */}
              <div className="bg-[#F2F6FB] p-6 rounded-3xl overflow-x-auto">
                <table className="w-full text-sm rounded-3xl overflow-hidden">
                  <thead>
                    <tr>
                      <th className="bg-[white] py-3 px-4 font-GT text-azulEscuro rounded-bl-3xl">ID</th>
                      <th className="bg-[white] py-3 px-4 font-GT text-azulEscuro">Localização</th>
                      <th className="bg-[white] py-3 px-4 font-GT text-azulEscuro">Status</th>
                      <th className="bg-[white] py-3 px-4 font-GT text-azulEscuro rounded-br-3xl">Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">Carregando...</td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">Sem resultados</td>
                      </tr>
                    ) : (
                      rows.map((item, index) => (
                        <tr key={index}>
                          <td className="py-4 px-4 text-center font-regular text-azulEscuro">{item.id}</td>
                          <td className="py-4 px-4 text-center text-[#2B2B2B]">{item.local || "—"}</td>
                          <td className="py-4 px-4 text-center">
                            <span className={`font-regular ${getStatusClass(item.status)}`}>{item.status}</span>
                          </td>
                          <td className="text-center py-4 px-4 text-[#2B2B2B]">
                            {formatDateISOToBR(item.data)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gráfico de alertas */}
            <div className="lg:col-span-1">
              <AlertasChart />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Relatorios;
