// Front-End/src/Pages/Navios.jsx
import { useEffect, useMemo, useState } from "react";
import Sidebar2 from "../Components/Sidebar2";
import Ancora from "../assets/assetsNavios/ancora.svg";
import Ferramenta from "../assets/assetsNavios/ferramenta.svg";
import Chevron from "../assets/assetsNavios/chevron.svg";
import NavioIcon from "../assets/assetsNavios/navio.svg";
import Troca from "../assets/assetsNavios/troca.svg";
import Início from "../assets/assetsNavios/inicio.svg";
import NavioAzul from "../assets/assetsNavios/navioAzul.svg";
import Pesquisa from "../assets/assetsAlertas/pesquisar.svg";
import Destino from "../assets/assetsNavios/destino.svg";
import Switch from "../assets/assetsNavios/switch.svg";
import X from "../assets/assetsNavios/x.svg";
import Setas from "../assets/assetsNavios/setas.svg";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";

const Navios = () => {
  const [filtro, setFiltro] = useState("Todos");
  const [pesquisa, setPesquisa] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transferindo, setTransferindo] = useState(false);
  const [selecionados, setSelecionados] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [navio1, setNavio1] = useState(null);
  const [navio2, setNavio2] = useState(null);


  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    setLoading(true);

    apiFetch("/api/v1/ships", { auth: true })
      .then((d) => {
        if (live) setRows(Array.isArray(d) ? d : []);
      })
      .catch(() => {
        if (live) setRows([]);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  function formatMesDia(dateStr) {
    if (!dateStr) return { mes: "—", dia: "—" };
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return { mes: "—", dia: "—" };
    const m = [
      "Jan.",
      "Fev.",
      "Mar.",
      "Abr.",
      "Mai.",
      "Jun.",
      "Jul.",
      "Ago.",
      "Set.",
      "Out.",
      "Nov.",
      "Dez.",
    ][d.getMonth()];
    return { mes: m, dia: String(d.getDate()).padStart(2, "0") };
  }

  const navios = useMemo(() => {
    const q = pesquisa.trim().toLowerCase();
    const base = rows.map((r) => ({
      nome: r.name || "",
      cod: r.imo || "",
      data: r.eta_date || null,
      status: [r.status || "", r.statusfuturo || ""].filter(Boolean),
      de: r.from_port || "—",
      para: r.to_port || "—",
      id: r.ship_id,
      inativo: r.active === false,
    }));
    const filtrado = base
      .filter((n) => {
        if (filtro === "Todos") return true;
        if (filtro === "Viajando") return n.status.includes("Em viagem");
        return n.status.includes(filtro);
      })
      .filter(
        (n) =>
          !q ||
          n.nome.toLowerCase().includes(q) ||
          String(n.cod).toLowerCase().includes(q)
      );
    return filtrado;
  }, [rows, filtro, pesquisa]);

  const statusColors = {
    "Em viagem":
      "bg-[#8BD2F4] text-white text-[10.8px] font-normal mt-2 mb-2",
    "Ancorado":
      "bg-[#C2FDB5] text-[#3BB61F] text-[10.8px] font-normal mt-2 mb-2",
    "Manutenção":
      "bg-[rgba(255,136,1,0.76)] text-[10.8px] text-white font-normal mt-2 mb-2",
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

  function toggleSelecionado(id) {
    if (selecionados.includes(id)) {
      setSelecionados(selecionados.filter((s) => s !== id));
    } else if (selecionados.length < 2) {
      setSelecionados([...selecionados, id]);
    }
  }

  function abrirTransferencia() {
    setTransferindo(true);
  }

  function cancelarTransferencia() {
    setTransferindo(false);
    setSelecionados([]);
  }

  function confirmarTransferencia() {
  if (selecionados.length !== 2) {
    alert("Selecione dois navios para transferir contêineres.");
    return;
  }

  const [id1, id2] = selecionados;
  const n1 = navios.find((n) => n.id === id1);
  const n2 = navios.find((n) => n.id === id2);
  setNavio1(n1);
  setNavio2(n2);
  setShowModal(true);
}

  function inverterNavios() {
  setNavio1(navio2);
  setNavio2(navio1);
}


  function fecharModal() {
    setShowModal(false);
    setTransferindo(false);
    setSelecionados([]);
  }

  return (
    <div className="min-h-screen w-full bg-[#ECF2F9] flex flex-col md:flex-row relative">
      <Sidebar2 />
      <div className={`flex-1 px-6 py-8 transition-opacity duration-300 ${showModal ? "opacity-0 pointer-events-none select-none" : ""}`}>
        <div className="flex justify-between">
          <div className="relative flex-1 max-w-full sm:max-w-4xl mb-4">
            <input
              type="text"
              placeholder="Pesquisar por nome ou código..."
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

        <div className="bg-white rounded-xl flex flex-col px-4 md:px-8 py-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-GT mb-8 font-bold">
              Gerenciamento de Navios
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={
                  transferindo
                    ? cancelarTransferencia
                    : () => navigate("/FormNavio")
                }
                className={`mb-6 text-[12px] font-medium px-6 py-2 rounded-full duration-300 cursor-pointer ${
                  transferindo
                    ? "bg-[#ECF2F9] text-azulEscuro hover:bg-white"
                    : "bg-[#ECF2F9] text-azulEscuro hover:bg-white"
                }`}
              >
                {transferindo ? "Cancelar" : "Adicionar Navio"}
              </button>

              <button
                type="button"
                onClick={transferindo ? confirmarTransferencia : abrirTransferencia}
                className="bg-violeta mb-6 text-white text-[12px] font-regular px-6 py-2 rounded-full hover:bg-roxo duration-300 cursor-pointer flex items-center gap-2"
              >
                {transferindo ? "Avançar" : "Transferir Contêiner"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10 text-[#5B61B3]">Carregando...</div>
          ) : (
            <div className="grid grid-cols-2 gap-6">
              {navios.map((n) => {
                const { mes, dia } = formatMesDia(n.data);
                const indice = selecionados.indexOf(n.id);
                return (
                  <div
                    key={n.id}
                    className={`relative ${
                      n.inativo ? "bg-[#F8EAEA]" : "bg-[#ECF2F9]"
                    } rounded-3xl p-6 shadow-sm flex justify-between items-center cursor-pointer transition-all duration-300 ${
                      selecionados.includes(n.id) ? "ring-2 ring-[#8BD2F4]" : ""
                    }`}
                    onClick={
                      transferindo
                        ? () => toggleSelecionado(n.id)
                        : () => navigate(`/DetalhesNavio?id=${n.id}`)
                    }
                  >
                    {transferindo && (
                      <div
                        className={`absolute -left-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                          selecionados.includes(n.id)
                            ? "bg-[#8BD2F4] border-[#8BD2F4] text-white shadow-lg"
                            : "bg-white border-[#C1C1C1] text-[#494594]"
                        }`}
                      >
                        {selecionados.includes(n.id) ? indice + 1 : ""}
                      </div>
                    )}

                    <div className="ml-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[22px] text-azulEscuro font-GT font-bold">
                          {n.nome}
                        </h3>
                        {n.inativo && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#FEE2E2] text-[#B91C1C]">
                            Inativo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500">
                        Cód: {n.cod || "—"}
                      </p>
                      <div className="flex gap-2 my-3 items-center flex-wrap">
                        {n.status.map((s, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span
                              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                                statusColors[s] || ""
                              }`}
                            >
                              <img
                                src={statusIcons[s]}
                                alt={s}
                                className="w-4 h-4"
                              />
                              {s}
                            </span>
                            {idx < n.status.length - 1 && (
                              <img
                                src={Chevron}
                                alt="chevron"
                                className="ml-2 mr-2 w-4 h-4 text-gray-400"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm">
                        <span className="font-bold text-[#494594]">De:</span>{" "}
                        <span
                          className={portoColors[n.de] || "text-[#494594]"}
                        >
                          {n.de}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-bold text-[#494594]">Para:</span>{" "}
                        <span
                          className={portoColors[n.para] || "text-[#494594]"}
                        >
                          {n.para}
                        </span>
                      </p>
                    </div>
                    <div className="text-right mr-4">
                      <div className="text-md mb-9">
                        <p className="text-xl font-medium text-roxo">{mes}</p>
                        <p className="text-[42px] font-bold text-[#191B40]">
                          {dia}
                        </p>
                      </div>
                      <p className="text-xs font-medium text-[#191B40] mt-2">
                        ETA aproximada
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-[900px] shadow-sm">
            <div className="justify-between flex items-center mb-8">
              <h3 className="text-xl font-GT text-azulEscuro">Troca</h3>
              <div className="flex gap-4">
                <div className="bg-deletar p-2 mt-2 rounded-[50%] hover:bg-white duration-500 cursor-pointer" onClick={inverterNavios}>
                  <img src={Switch} alt="Inverter" className="w-5 h-5" />
                </div>
                <div
                  onClick={fecharModal}
                  className="p-2 mt-2 rounded-[50%] bg-[rgba(242,29,78,0.2)] hover:bg-[#F21D4E] duration-500 cursor-pointer"
                >
                  <img src={X} alt="Sair" className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center">
              <div className="flex-1 w-full bg-[#ECF2F9] rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="text-azulEscuro text-[18px] font-medium">Navio 1</h4>
                  <div className="bg-white px-10 py-1 h-full rounded-3xl flex gap-3 items-center">
                    <p className="font-GT text-[18px] text-azulEscuro">{navio1?.nome}</p>
                    <img src={NavioAzul} alt="Navio" className="w-5 h-5 mb-0.5" />
                  </div>
                </div>
                <div className="flex flex-col mt-14">
                  <p className="text-[#191B40] font-semibold text-[12px] opacity-50">Origem</p>
                  <div className="flex justify-start items-center gap-2">
                    <div className="bg-white p-2 mt-2 rounded-[50%]">
                      <img src={Início} alt="Início" className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-azulEscuro opacity-95 text-[13px] mt-2">{navio1?.de}</p>
                    <p className="ml-6 mr-6 font-extralight text-[22px] text-azulEscuro opacity-20">/</p>
                    <div className="bg-white p-2 mt-2 rounded-[50%]">
                      <img src={Destino} alt="Destino" className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-azulEscuro opacity-95 text-[13px] mt-2">{navio1?.para}</p>
                  </div>
                  <div className="bg-white ml-0.5 mr-0.5 px-5 py-4 h-full mt-20 rounded-3xl min-h-36">
                    <p className="text-azulEscuro font-medium text-[11px]">Lista de contêineres:</p>
                    <p className="font-normal text-azulEscuro text-[13px] mt-2">Contêiner 1</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center w-16 h-16 bg-white rounded-full z-10 -mx-6 my-2 md:my-0 border-4 border-white">
                <img src={Troca} alt="Troca" className="w-12 h-12" />
              </div>

              <div className="flex-1 w-full bg-[#ECF2F9] rounded-3xl p-6 shadow-sm">
                <div className="flex justify-between items-center">
                  <h4 className="text-azulEscuro text-[18px] font-medium">Navio 2</h4>
                  <div className="bg-white px-10 py-1 h-full rounded-3xl flex gap-3 items-center">
                    <p className="font-GT text-[18px] text-azulEscuro">{navio2?.nome}</p>
                    <img src={NavioAzul} alt="Navio" className="w-5 h-5 mb-0.5" />
                  </div>
                </div>
                <div className="flex flex-col mt-14">
                  <p className="text-[#191B40] font-semibold text-[12px] opacity-50">Origem</p>
                  <div className="flex justify-start items-center gap-2">
                    <div className="bg-white p-2 mt-2 rounded-[50%]">
                      <img src={Início} alt="Início" className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-azulEscuro opacity-95 text-[13px] mt-2">{navio2?.de}</p>
                    <p className="ml-6 mr-6 font-extralight text-[22px] text-azulEscuro opacity-20">/</p>
                    <div className="bg-white p-2 mt-2 rounded-[50%]">
                      <img src={Destino} alt="Destino" className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-azulEscuro opacity-95 text-[13px] mt-2">{navio1?.para}</p>
                  </div>
                  <div className="bg-white ml-0.5 mr-0.5 px-5 py-4 h-full mt-20 rounded-3xl min-h-36">
                    <p className="text-azulEscuro font-medium text-[11px]">Lista de contêineres:</p>
                    <p className="font-normal text-azulEscuro text-[13px] mt-2">Contêiner 2</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-8"> <button onClick={() => { alert("Transferência concluída!"); setShowModal(false); setTransferindo(false); setSelecionados([]); }} className="px-8 py-4 bg-violeta rounded-3xl text-white font-light text-sm hover:bg-roxo transition flex gap-3" > Confirmar Transferência <img src={Setas} alt="Setas" className="w-5 h-5" /> </button> </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navios;
