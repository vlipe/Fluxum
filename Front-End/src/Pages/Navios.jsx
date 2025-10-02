import { useEffect, useMemo, useState } from "react";
import Sidebar2 from "../Components/Sidebar2";
import Ancora from "../assets/assetsNavios/ancora.svg";
import Ferramenta from "../assets/assetsNavios/ferramenta.svg";
import Chevron from "../assets/assetsNavios/chevron.svg";
import NavioIcon from "../assets/assetsNavios/navio.svg";
import Pesquisa from "../assets/assetsAlertas/pesquisar.svg";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

const Navios = () => {
  const [filtro, setFiltro] = useState("Todos");
  const [pesquisa, setPesquisa] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    setLoading(true);
    apiFetch("/api/v1/ships")
      .then(d => { if (live) setRows(Array.isArray(d)?d:[]) })
      .catch(() => { if (live) setRows([]) })
      .finally(() => { if (live) setLoading(false) });
    return () => { live = false };
  }, []);

  function formatMesDia(dateStr) {
    if (!dateStr) return { mes: "—", dia: "—" };
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return { mes: "—", dia: "—" };
    const m = ["Jan.","Fev.","Mar.","Abr.","Mai.","Jun.","Jul.","Ago.","Set.","Out.","Nov.","Dez."][d.getMonth()];
    return { mes: m, dia: String(d.getDate()).padStart(2,"0") };
  }

  const navios = useMemo(() => {
    const q = pesquisa.trim().toLowerCase();
    const base = rows.map(r => ({
      nome: r.name || "",
      cod: r.imo || "",
      data: r.eta_date || null,
      status: [r.status || ""].filter(Boolean),
      de: r.from_port || "—",
      para: r.to_port || "—",
      id: r.ship_id
    }));
    const filtrado = base
      .filter(n => {
        if (filtro === "Todos") return true;
        if (filtro === "Viajando") return n.status.includes("Em viagem");
        return n.status.includes(filtro);
      })
      .filter(n => !q || n.nome.toLowerCase().includes(q) || String(n.cod).toLowerCase().includes(q));
    return filtrado;
  }, [rows, filtro, pesquisa]);

  const statusColors = {
    "Em viagem": "bg-[#8BD2F4] text-white text-[10.8px] font-normal mt-2 mb-2",
    "Ancorado": "bg-[#C2FDB5] text-[#3BB61F] text-[10.8px] font-normal mt-2 mb-2",
    "Manutenção": "bg-[rgba(255,136,1,0.76)] text-[10.8px] text-white font-normal mt-2 mb-2",
  };

  const statusIcons = {
    "Em viagem": NavioIcon,
    "Ancorado": Ancora,
    "Manutenção": Ferramenta,
  };

  const portoColors = {
    "Porto de Santos": "text-[#494594]",
    "Porto Itapoá": "text-[#494594]",
    "Porto de Paranaguá": "text-[#494594]",
  };

  return (
    <div className="min-h-screen w-full bg-[#ECF2F9] flex flex-col md:flex-row relative">
      <Sidebar2 />
      <div className="flex-1 px-6 py-8">
        <div className="flex justify-between">
          <div className="relative flex-1 max-w-full sm:max-w-4xl mb-4">
            <input
              type="text"
              placeholder="Pesquisar por nome ou código..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="w-full h-12 rounded-3xl bg-white pl-16 pr-4 text-sm focus:outline-none shadow-sm"
            />
            <img src={Pesquisa} alt="Pesquisar" className="w-5 h-5 absolute ml-6 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <button type="button" onClick={() => navigate("/FormNavio")} className="bg-[#ECF2F9] mb-6 text-azulEscuro text-[12px] font-medium px-6 py-2 rounded-full hover:bg-white duration-300 cursor-pointer">
            Adicionar Navio
          </button>
        </div>

        <div className="bg-white rounded-xl flex flex-col px-4 md:px-8 py-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-GT mb-8">Gerenciamento de Navios</h2>
          </div>

          <div className="bg-[#ECF2F9] flex overflow-x-auto scrollbar-hide rounded-full w-1/2 h-12 mb-6 gap-1">
            {["Todos", "Viajando", "Ancorado", "Manutenção"].map((aba) => {
              const ativa = filtro === aba;
              return (
                <button
                  key={aba}
                  onClick={() => setFiltro(aba)}
                  className={`flex-shrink-0 flex justify-center items-center px-10 font-normal transition-all duration-500 ${ativa ? "bg-violeta text-white shadow-[4px_0px_3px_rgba(91,97,179,0.4)] rounded-full" : "text-violeta hover:text-indigo-300"}`}
                >
                  {aba}
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="text-center py-10 text-[#5B61B3]">Carregando...</div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {navios.map((n) => {
                const { mes, dia } = formatMesDia(n.data);
                return (
                  <div
                    key={n.id}
                    className="bg-[#ECF2F9] rounded-3xl p-6 shadow-sm flex justify-between items-center cursor-pointer"
                    onClick={() => navigate(`/DetalhesNavio?id=${n.id}`)}
                  >
                    <div>
                      <h3 className="text-[22px] text-azulEscuro font-GT">{n.nome}</h3>
                      <p className="text-[11px] text-gray-500">Cód: {n.cod || "—"}</p>
                      <div className="flex gap-2 my-3 items-center flex-wrap">
                        {n.status.map((s, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusColors[s] || ""}`}>
                              <img src={statusIcons[s]} alt={s} className="w-4 h-4" />
                              {s}
                            </span>
                            {idx < n.status.length - 1 && <img src={Chevron} alt="chevron" className="ml-2 mr-2 w-4 h-4 text-gray-400" />}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm">
                        <span className="font-bold text-[#494594]">De:</span>{" "}
                        <span className={portoColors[n.de] || "text-gray-600"}>{n.de}</span>
                      </p>
                      <p className="text-sm">
                        <span className="font-bold text-[#494594]">Para:</span>{" "}
                        <span className={portoColors[n.para] || "text-gray-600"}>{n.para}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-medium text-roxo">{mes}</p>
                      <p className="text-[42px] font-GT text-azulEscuro">{dia}</p>
                      <p className="text-xs text-gray-400 mt-2">ETA aproximada</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navios;
