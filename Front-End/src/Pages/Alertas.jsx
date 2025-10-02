import { useState } from "react";
import Sidebar2 from "../Components/Sidebar2";

import Carregado from "../assets/assetsAlertas/carregado.svg";
import Descarregado from "../assets/assetsAlertas/descarregado.svg";
import Rota from "../assets/assetsAlertas/rota.svg";
import Termometro from "../assets/assetsAlertas/termometro.svg";
import Check from "../assets/assetsAlertas/check.svg";
import Pesquisa from "../assets/assetsAlertas/pesquisar.svg";
import Livro from "../assets/assetsAlertas/livro.svg";

const Alertas = () => {
  const [abaSelecionada, setAbaSelecionada] = useState("Todos");
  const [pesquisa, setPesquisa] = useState("");
  const [alertas, setAlertas] = useState([
    {
      id: 1,
      icone: Termometro,
      titulo: "Temperatura acima do limite",
      tempo: "há 1 min.",
      acao: "Marcar como concluída",
      tipo: "Pendentes",
      containerId: "C01",
      containerNome: "Container A",
      iotNome: "IoT 1",
    },
    {
      id: 2,
      icone: Descarregado,
      titulo: "IoT descarregada",
      tempo: "há 39 min.",
      acao: "Nada para concluir . . .",
      tipo: "Pendentes",
      containerId: "C02",
      containerNome: "Container B",
      iotNome: "Sensor de Bateria",
    },
    {
      id: 3,
      icone: Rota,
      titulo: "Rota inesperada detectada",
      tempo: "há 22h.",
      acao: "Marcar como concluída",
      tipo: "Pendentes",
      containerId: "C03",
      containerNome: "Container C",
      iotNome: "GPS Tracker",
    },
    {
      id: 4,
      icone: Carregado,
      titulo: "IoT carregada com sucesso",
      tempo: "há 32d.",
      acao: "Concluído",
      tipo: "Resolvidos",
      containerId: "C04",
      containerNome: "Container D",
      iotNome: "Sensor de Carga",
    },
  ]);

  const [alertaSelecionado, setAlertaSelecionado] = useState(null);

  const abas = ["Todos", "Pendentes", "Resolvidos"];

  const abrirModal = (alerta) => setAlertaSelecionado(alerta);
  const fecharModal = () => setAlertaSelecionado(null);

  const tempoEmDias = (tempo) => {
    if (tempo.includes("d")) return parseInt(tempo.match(/\d+/)[0]);
    if (tempo.includes("h")) return 0;
    if (tempo.includes("min")) return 0;
    return 0;
  };

  const concluirAlerta = (id) => {
    setAlertas((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, tipo: "Resolvidos", acao: "Concluído" }
          : a
      )
    );
  };

  const alertasFiltrados = alertas
    .filter((a) => tempoEmDias(a.tempo) <= 31)
    .filter((alerta) => {
      const correspondeAba =
        abaSelecionada === "Todos" || alerta.tipo === abaSelecionada;
      const correspondePesquisa = alerta.titulo
        .toLowerCase()
        .includes(pesquisa.toLowerCase());
      return correspondeAba && correspondePesquisa;
    });

  return (
    <div className="min-h-screen w-full bg-deletar flex flex-col md:flex-row relative">
      <Sidebar2 />

      <div className="flex flex-col w-full md:w-[96%] mt-8 mb-8 px-4 md:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
          <p className="mr-4 text-xl">
            
          </p>

          <div className="relative flex-1 max-w-full sm:max-w-4xl">
            <input
              type="text"
              placeholder="Pesquisar alerta"
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

        <div className="bg-white rounded-xl flex flex-col px-4 md:px-8 py-6 h-full">

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold font-GT text-azulEscuro">
              Alertas
            </h1>
          </div>

          <div className="bg-[#F2F6FB] flex overflow-x-auto scrollbar-hide rounded-full h-12 w-1/2 mb-6 gap-1">
            {abas.map((aba) => {
              const ativa = abaSelecionada === aba;
              return (
                <button
                  key={aba}
                  onClick={() => setAbaSelecionada(aba)}
                  className={`flex-shrink-0 flex justify-center items-center px-9 font-normal transition-all duration-500 
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

          <div className="flex flex-col gap-4 md:gap-8">
            {alertasFiltrados.length > 0 ? (
              alertasFiltrados.map((alerta) => (
                <div
                  key={alerta.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between bg-[#F2F6FB] px-4 md:px-6 py-4 md:py-5 rounded-3xl gap-4 sm:gap-0"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow cursor-pointer"
                      onClick={() => abrirModal(alerta)}
                    >
                      <img
                        src={alerta.icone}
                        alt="icone alerta"
                        className="w-6 h-6"
                      />
                    </div>
                    <p className="text-[#3E41C0] font-medium break-words">
                      {alerta.titulo}
                    </p>
                  </div>

                  <span className="text-sm text-[#3E41C0]">{alerta.tempo}</span>

                  <button
                    onClick={() =>
                      alerta.acao === "Marcar como concluída" &&
                      concluirAlerta(alerta.id)
                    }
                    className={`font-medium text-sm px-8 py-4 rounded-full bg-white flex items-center justify-center gap-2 ${
                      alerta.acao === "Nada para concluir . . ."
                        ? "text-violeta"
                        : "text-[#3BB61F] hover:underline"
                    }`}
                  >
                    {alerta.acao === "Marcar como concluída" && (
                      <img src={Check} alt="check" className="w-4 h-4" />
                    )}
                    {alerta.acao}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">
                Nenhum alerta encontrado...
              </p>
            )}
          </div>
        </div>
      </div>

      {alertaSelecionado && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
            onClick={fecharModal}
          ></div>

          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-3xl p-6 z-50 w-full max-w-md shadow-lg">
            <div className="flex">
              <img
                src={Livro}
                alt="icone livro"
                className="w-6 h-6 -ml-1 mr-4"
              />
              <h2 className="text-xl text-azulEscuro font-GT mb-6">
                Detalhes do Alerta
              </h2>
            </div>
            <p>
              <strong className="font-GT text-azulEscuro">
                ID do Container:
              </strong>{" "}
              {alertaSelecionado.containerId}
            </p>
            <p>
              <strong className="font-GT text-azulEscuro">
                Nome do Container:
              </strong>{" "}
              {alertaSelecionado.containerNome}
            </p>
            <p>
              <strong className="font-GT text-azulEscuro">IoT:</strong>{" "}
              {alertaSelecionado.iotNome}
            </p>
            <button
              onClick={fecharModal}
              className="w-full mt-4 px-4 py-2 bg-violeta border-2 border-violeta text-white rounded-[35px] hover:bg-transparent hover:text-violeta hover:border-2 duration-300"
            >
              Fechar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Alertas;
