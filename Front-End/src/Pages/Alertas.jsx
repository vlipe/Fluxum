import { useEffect, useState, useCallback } from "react";
import Sidebar2 from "../Components/Sidebar2";
import Carregado from "../assets/assetsAlertas/carregado.svg";
import Descarregado from "../assets/assetsAlertas/descarregado.svg";
import Rota from "../assets/assetsAlertas/rota.svg";
import Termometro from "../assets/assetsAlertas/termometro.svg";
import Check from "../assets/assetsAlertas/check.svg";
import Pesquisa from "../assets/assetsAlertas/pesquisar.svg";
import Livro from "../assets/assetsAlertas/livro.svg";
import { apiFetch } from "../lib/api";
import ConnectionBadge from "../Components/ConnectionBadge";

function timeAgo(iso) {
  try {
    const d = iso ? new Date(iso) : null;
    if (!d) return "—";
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    const days = Math.floor(diff / 86400);
    return `${days}d atrás`;
  } catch {
    return "—";
  }
}

function iconForType(t, msg = "") {
  const T = String(t || "").toUpperCase();
  if (T.includes("TEMP")) return Termometro;
  if (T.includes("ROUTE")) return Rota;
  if (T.includes("BAT")) return Descarregado;
  if (T.includes("OPEN") || T.includes("CLOSE")) return Check;
  if (msg.toLowerCase().includes("bateria")) return Descarregado;
  return Livro;
}

function titleFromRow(r) {
  const T = String(r.alert_type || "").toUpperCase();
  const id = r.container_id || "—";
  const base =
    T.includes("TEMP") ? "Temperatura elevada" :
    T === "ROUTE_DEVIATION" ? "Rota desviada" :
    T === "ROUTE_COMPLETED" ? "Rota concluída" :
    "Alerta";
  return `${base} ${id}`;
}

function severityPt(n) {
  const s = Number(n);
  if (s <= 1) return "Baixa";
  if (s === 2) return "Média";
  return "Alta";
}

function humanizeAlert(r) {
  const t = String(r.alert_type || "").toUpperCase();
  if (r.message && r.message.trim()) return r.message.trim();
  if (t.includes("TEMP")) return "Temperatura acima do limite";
  if (t === "ROUTE_DEVIATION") return "Desvio de rota detectado";
  if (t === "DOOR_OPEN") return "Abertura de porta detectada";
  if (t.includes("BAT")) return "Nível de bateria baixo";
  return "Alerta gerado pelo sistema";
}


const Alertas = () => {
  const [abaSelecionada, setAbaSelecionada] = useState("Todos");
  const [pesquisa, setPesquisa] = useState("");
  const [alertas, setAlertas] = useState([]);
  const [alertaSelecionado, setAlertaSelecionado] = useState(null);
  const [resolvendoId, setResolvendoId] = useState(null);
  const abas = ["Todos", "Pendentes", "Resolvidos"];

const carregar = useCallback(async () => {
  const rows = await apiFetch("/api/v1/alerts?limit=200", { auth: true });
  const mapped = (rows || []).map((r) => {
    const pendente = !r.acknowledged_at;
    const severidade = r.severity_label || severityPt(r.severity);
    const descricao = r.human_message || humanizeAlert(r);

    return {
      id: r.id,
      icone: iconForType(r.alert_type, r.message || ""),
      titulo: titleFromRow(r),
      tempo: timeAgo(r.created_at),
      acao: pendente ? "Marcar como concluída" : "Concluído",
      tipo: pendente ? "Pendentes" : "Resolvidos",
      containerId: r.container_id || "—",
      containerNome: r.container_id || "—",
      iotNome: "IoT",

     
      navioNome: r.ship_name || "—",
      containerTipo: r.container_type || "—",
      containerOwner: r.container_owner || "—",
      severidade,
      descricao,

      raw: r
    };
  });
  setAlertas(mapped);
}, []);


  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!alive) return;
        await carregar();
      } catch (err){console.warn(err)}
    })();
    return () => { alive = false; };
  }, [carregar]);

  async function concluirAlerta(id) {
    const alvo = alertas.find((a) => a.id === id);
    if (!alvo || resolvendoId) return;
    setResolvendoId(id);
    try {
      await apiFetch(`/api/v1/alerts/${id}/ack`, { method: "PATCH", auth: true });
      setAlertas((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, tipo: "Resolvidos", acao: "Concluído" } : a
        )
      );
      if (alertaSelecionado?.id === id) setAlertaSelecionado(null);
    } catch (err){console.warn(err)} finally {
      setResolvendoId(null);
    }
  }

  async function excluirAlerta(id) {
    if (!id || resolvendoId) return;
    setResolvendoId(id);
    try {
      await apiFetch(`/api/v1/alerts/${id}`, { method: "DELETE", auth: true });
      setAlertas((prev) => prev.filter((a) => a.id !== id));
      if (alertaSelecionado?.id === id) setAlertaSelecionado(null);
    } catch  (err){console.warn(err)} finally {
      setResolvendoId(null);
    }
  }

  const tempoEmDias = (tempo) => {
    if (!tempo) return 0;
    if (tempo.includes("d")) return parseInt(tempo.match(/\d+/)[0]);
    return 0;
  };

  const alertasFiltrados = alertas
    .filter((a) => tempoEmDias(a.tempo) <= 31)
    .filter((alerta) => {
      const correspondeAba = abaSelecionada === "Todos" || alerta.tipo === abaSelecionada;
      const correspondePesquisa = alerta.titulo.toLowerCase().includes(pesquisa.toLowerCase());
      return correspondeAba && correspondePesquisa;
    });

  return (
    <div className="min-h-screen w-full bg-deletar flex flex-col md:flex-row relative">
      <Sidebar2 />
      <div className="flex flex-col w-full md:w-[96%] mt-8 mb-8 px-4 md:px-6">
        <div className=" flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4 max-[760px]:mt-14">
          <p></p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 max-w-full sm:max-w-4xl">
              <input
                type="text"
                placeholder="Pesquisar alerta..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="w-full h-12 rounded-3xl bg-white pl-16 pr-4 text-sm focus:outline-none shadow-sm"
              />
              <img src={Pesquisa} alt="Pesquisar" className="w-5 h-5 absolute ml-6 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl flex flex-col px-4 md:px-8 py-6 h-full">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-bold font-GT text-azulEscuro">Alertas</h1>
          </div>
          <div className="bg-[#F2F6FB] flex overflow-x-auto scrollbar-hide rounded-full h-12 w-full mb-6 gap-1">
            {abas.map((aba) => {
              const ativa = abaSelecionada === aba;
              return (
                <button
                  key={aba}
                  onClick={() => setAbaSelecionada(aba)}
                  className={`flex-shrink-0 flex justify-center items-center px-10   font-normal transition-all duration-500 ${ativa ? "bg-violeta text-white shadow-[4px_0px_3px_rgba(91,97,179,0.4)] rounded-full" : "text-violeta hover:text-indigo-300"}`}
                >
                  {aba}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-4 md:gap-8">
            {alertasFiltrados.length > 0 ? (
  alertasFiltrados.map((alerta) => (
    <div
      key={alerta.id}
      role="button"
      tabIndex={0}
      onClick={(e) => {
        if (e.target.closest("button")) return;
        setAlertaSelecionado(alerta);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setAlertaSelecionado(alerta);
        }
      }}
      className="grid grid-cols-1 sm:grid-cols-12 sm:items-center bg-[#F2F6FB] px-4 md:px-6 py-4 md:py-5 rounded-3xl gap-4 cursor-pointer hover:ring-2 hover:ring-violeta/40 transition"
    >
      <div className="flex items-center gap-4 sm:col-span-7">
        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow">
          <img src={alerta.icone} alt="icone alerta" className="w-6 h-6" />
        </div>
        <p className="text-[#3E41C0] font-medium break-words">{alerta.titulo}</p>
      </div>

      <span className="text-sm text-[#3E41C0] text-center sm:col-span-2">
        {alerta.tempo}
      </span>

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (alerta.acao === "Marcar como concluída") concluirAlerta(alerta.id);
        }}
        disabled={resolvendoId === alerta.id || alerta.acao !== "Marcar como concluída"}
        className={`font-medium text-sm px-8 py-4 rounded-full bg-white flex items-center justify-center gap-2 sm:col-span-3 ${
          alerta.acao === "Nada para concluir . . ." ? "text-violeta" : "text-[#3BB61F] hover:underline"
        } ${resolvendoId === alerta.id ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {alerta.acao === "Marcar como concluída" && (
          <img src={Check} alt="check" className="w-4 h-4" />
        )}
        {resolvendoId === alerta.id ? "Salvando..." : alerta.acao}
      </button>
    </div>
  ))
) : (
  <p className="text-gray-500 text-sm">Nenhum alerta encontrado...</p>
)}

          </div>
        </div>
      </div>

    {alertaSelecionado && (
  <>
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40" onClick={() => setAlertaSelecionado(null)}></div>
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 z-50 w-full max-w-md shadow-lg">
      <div className="flex">
        <img src={Livro} alt="icone livro" className="w-6 h-6 -ml-1 mr-4" />
        <h2 className="text-xl text-azulEscuro font-GT mb-6">Detalhes do Alerta</h2>
      </div>

      <p><strong className="font-GT text-azulEscuro">ID do Container:</strong> {alertaSelecionado.containerId}</p>
      <p><strong className="font-GT text-azulEscuro">Tipo do Container:</strong> {alertaSelecionado.containerTipo}</p>
      <p><strong className="font-GT text-azulEscuro">Proprietário do Container:</strong> {alertaSelecionado.containerOwner}</p>
      <p><strong className="font-GT text-azulEscuro">Navio (via IMO):</strong> {alertaSelecionado.navioNome}</p>
      <p><strong className="font-GT text-azulEscuro">Severidade:</strong> {alertaSelecionado.severidade}</p>
      <p><strong className="font-GT text-azulEscuro">Descrição:</strong> {alertaSelecionado.descricao}</p>
      <p><strong className="font-GT text-azulEscuro">IoT:</strong> {alertaSelecionado.iotNome}</p>

      <button
        onClick={() => {
          if (alertaSelecionado.acao === "Marcar como concluída") concluirAlerta(alertaSelecionado.id);
          else setAlertaSelecionado(null);
        }}
        disabled={resolvendoId === alertaSelecionado.id}
        className={`w-full mt-4 px-4 py-2 bg-[#3CB371] border-2 border-[#3BB61F] text-white rounded-[35px] hover:bg-transparent hover:text-[#3BB61F] duration-300 ${resolvendoId === alertaSelecionado.id ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        {resolvendoId === alertaSelecionado.id ? "Salvando..." : alertaSelecionado.acao === "Marcar como concluída" ? "Marcar como concluída" : "Fechar"}
      </button>

      <button
        onClick={() => excluirAlerta(alertaSelecionado.id)}
        disabled={resolvendoId === alertaSelecionado.id}
        className="w-full mt-2 px-4 py-2 bg-violeta border-2 border-violeta text-white rounded-[35px] hover:bg-transparent hover:text-violeta hover:border-2 duration-300"
      >
        Excluir
      </button>
    </div>
  </>
)}

    </div>
  );
};

export default Alertas;
