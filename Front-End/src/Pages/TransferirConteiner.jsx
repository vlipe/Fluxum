import Sidebar2 from "../Components/Sidebar2";
import { useState } from "react";

const TransferirConteiner = () => {
  const [navioOrigem, setNavioOrigem] = useState("");
  const [navioDestino, setNavioDestino] = useState("");
  const [selecionados, setSelecionados] = useState([]);

  const navios = ["Estrela do Mar", "Lisboa", "Cruzeiro do Sul", "Norte II"];
  const containers = [
    { id: "C001", status: "Ativo" },
    { id: "C002", status: "Inativo" },
    { id: "C003", status: "Ativo" },
  ];

  const handleSelect = (id) => {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleTransferir = () => {
    if (!navioOrigem || !navioDestino || selecionados.length === 0) {
      alert("Preencha todos os campos e selecione ao menos um contêiner!");
      return;
    }
    alert(`Transferindo ${selecionados.length} contêiner(es) de ${navioOrigem} para ${navioDestino}`);
    // aqui depois você faz a requisição POST /api/containers/transfer
  };

  return (
    <div className="flex min-h-screen bg-[#EEF3FB]">
      <Sidebar2 />
      <div className="flex-1 flex flex-col justify-center items-center p-6">
        <h2 className="text-2xl font-semibold text-azulEscuro mb-6 font-GT">
          Transferência de Contêineres
        </h2>

        <div className="bg-white rounded-3xl p-8 w-full max-w-4xl shadow-md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-azulEscuro mb-2">Navio de Origem</label>
              <select
                value={navioOrigem}
                onChange={(e) => setNavioOrigem(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-violeta"
              >
                <option value="">Selecione...</option>
                {navios.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-azulEscuro mb-2">Navio de Destino</label>
              <select
                value={navioDestino}
                onChange={(e) => setNavioDestino(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-violeta"
              >
                <option value="">Selecione...</option>
                {navios
                  .filter((n) => n !== navioOrigem)
                  .map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
              </select>
            </div>
          </div>

          {navioOrigem && (
            <div className="bg-[#EEF3FB] p-4 rounded-2xl mb-6">
              <h3 className="text-base font-semibold text-azulEscuro mb-3">
                Contêineres do navio {navioOrigem}
              </h3>
              <div className="space-y-2">
                {containers.map((c) => (
                  <label key={c.id} className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selecionados.includes(c.id)}
                        onChange={() => handleSelect(c.id)}
                        className="accent-violeta w-4 h-4"
                      />
                      <span className="text-azulEscuro font-medium">{c.id}</span>
                    </div>
                    <span
                      className={`text-sm ${
                        c.status === "Ativo" ? "text-[#3BB61F]" : "text-[#F21D4E]"
                      }`}
                    >
                      {c.status}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-4">
            <button
              onClick={() => (window.location.href = "/Navios")}
              className="w-36 h-10 rounded-xl bg-[#ECF2F9] text-[#5B61B3] text-[14px] font-medium hover:bg-slate-200 duration-300"
            >
              Voltar
            </button>
            <button
              onClick={handleTransferir}
              className="w-36 h-10 rounded-xl bg-violeta text-white text-[14px] font-medium hover:bg-roxo duration-300"
            >
              Transferir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferirConteiner;
