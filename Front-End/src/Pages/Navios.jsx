import { useState } from "react";
import Sidebar2 from "../Components/Sidebar2";
import Ancora from "../assets/assetsNavios/ancora.svg";
import Ferramenta from "../assets/assetsNavios/ferramenta.svg";
import Chevron from "../assets/assetsNavios/chevron.svg";
import Navio from "../assets/assetsNavios/navio.svg";
import Pesquisa from "../assets/assetsAlertas/pesquisar.svg";

const Navios = () => {
  const [filtro, setFiltro] = useState("Todos");
  const [pesquisa, setPesquisa] = useState("");

  const navios = [
    {
      nome: "Estrela do Mar",
      cod: "10012",
      data: "Jan. 22",
      status: ["Ancorado", "Em viagem"],
      de: "Porto de Santos",
      para: "Porto Itapoá",
    },
    {
      nome: "Lisboa",
      cod: "10010",
      data: "Nov. 30",
      status: ["Em viagem", "Manutenção"],
      de: "Porto de Santos",
      para: "Porto Itapoá",
    },
    {
      nome: "Cruzeiro do Sul",
      cod: "10011",
      data: "Mai. 01",
      status: ["Manutenção", "Ancorado"],
      de: "Porto de Santos",
      para: "Porto de Paranaguá",
    },
    {
      nome: "Norte II",
      cod: "10013",
      data: "Abr. 09",
      status: ["Ancorado", "Em viagem"],
      de: "Porto de Santos",
      para: "Porto de Paranaguá",
    },
  ];

  const statusColors = {
    "Em viagem": "bg-[#8BD2F4] text-white text-[10.8px] font-normal mt-2 mb-2",
    "Ancorado": "bg-[#C2FDB5] text-[#3BB61F] text-[10.8px] font-normal mt-2 mb-2",
    "Manutenção": "bg-[rgba(255,136,1,0.76)] text-[10.8px] text-white font-normal mt-2 mb-2",
  };

  const statusIcons = {
    "Em viagem": Navio,
    "Ancorado": Ancora,
    "Manutenção": Ferramenta,
  };

  const portoColors = {
  "Porto de Santos": "text-[#494594]",
  "Porto Itapoá": "text-[#494594]",
  "Porto de Paranaguá": "text-[#494594]",
};


  const filtros = ["Todos", "Viajando", "Ancorado", "Manutenção"];

  const filtrarNavios = () => {
    return navios
      .filter((n) => {
        if (filtro === "Todos") return true;
        if (filtro === "Viajando") return n.status.includes("Em viagem");
        return n.status.includes(filtro);
      })
      .filter(
        (n) =>
          n.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
          n.cod.toLowerCase().includes(pesquisa.toLowerCase())
      );
  };

  return (
    <div className="min-h-screen w-full bg-[#ECF2F9] flex flex-col md:flex-row relative">
      <Sidebar2 />
      <div className="flex-1 px-6 py-8">
        {/* barra de pesquisa */}
        <div className="flex justify-between">
            <h2></h2>
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
          {/* título */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-GT mb-8">Gerenciamento de Navios</h2>
            <button className="bg-[#ECF2F9] mb-6 text-azulEscuro text-[12px] font-medium px-6 py-2 rounded-full hover:bg-white duration-300 cursor-pointer">
              Adicionar Navio
            </button>
          </div>

          {/* abas de filtro */}
          <div className="bg-[#ECF2F9] flex overflow-x-auto scrollbar-hide rounded-full w-1/2 h-12 mb-6 gap-1">
            {filtros.map((aba) => {
              const ativa = filtro === aba;
              return (
                <button
                  key={aba}
                  onClick={() => setFiltro(aba)}
                  className={`flex-shrink-0 flex justify-center items-center px-10 font-normal transition-all duration-500 
                  ${
                    ativa
                      ? "bg-violeta text-white shadow-[4px_0px_3px_rgba(91,97,179,0.4)] rounded-full"
                      : "text-violeta hover:text-indigo-300"
                  }`}
                >
                  {aba}
                </button>
              );
            })}
          </div>

          {/* cards */}
          <div className="grid grid-cols-2 gap-6">
            {filtrarNavios().map((n, i) => (
              <div
                key={i}
                className="bg-[#ECF2F9] rounded-3xl p-6 shadow-sm flex justify-between items-center cursor-pointer"
              >
                <div>
                  <h3 className="text-[22px] text-azulEscuro font-GT">{n.nome}</h3>
                  <p className="text-[11px] text-gray-500">Cód: {n.cod}</p>
                  <div className="flex gap-2 my-3 items-center flex-wrap">
                    {n.status.map((s, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span
                          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusColors[s]}`}
                        >
                          <img src={statusIcons[s]} alt={s} className="w-4 h-4" />
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
  <span className={portoColors[n.de] || "text-gray-600"}>{n.de}</span>
</p>

                  <p className="text-sm">
  <span className="font-bold text-[#494594]">Para:</span>{" "}
  <span className={portoColors[n.para] || "text-gray-600"}>{n.para}</span>
</p>

                </div>
                <div className="text-right">
                  
                  <p className="text-xl font-medium text-roxo">{n.data.split(" ")[0]}</p>
                  <p className="text-[42px] font-GT text-azulEscuro">{n.data.split(" ")[1]}</p>
                  <p className="text-xs text-gray-400 mt-2">ETA aproximada</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navios;
