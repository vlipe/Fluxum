import { useState } from "react";
import Sidebar2 from "../Components/Sidebar2";
import Pesquisa from "../assets/assetsAlertas/pesquisar.svg";
import Grafico from "../assets/assetsRelatorios/grafico.svg";
import Horario from "../assets/assetsRelatorios/horario.svg";

const AlertasChart = () => {
  const data = [
    { month: "Jan", height: "h-96" },
    { month: "Fev", height: "h-40" },
    { month: "Mar", height: "h-64" },
    { month: "Abr", height: "h-28" },
  ];

  return (
    <div className="bg-[#F2F6FB] p-6 rounded-3xl h-full flex flex-col">
      <p className="text-sm text-azulEscuro font-medium">Alertas registrados</p>
      <div className="flex-1 flex items-end justify-center gap-4 mt-4">
        {data.map((item) => (
          <div key={item.month} className="flex flex-col items-center gap-2">
            <div className={`w-10 sm:w-12 bg-[#9F9CE8] ${item.height} rounded-xl`}></div>
            <span className="text-xs text-gray-500">{item.month}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Relatorios = () => {
  const [pesquisa, setPesquisa] = useState("");

  const dadosTabela = [
    { id: "PCDO-004-BSZ", local: "São Paulo, SP", status: "Atrasado", data: "08/08/2025" },
    { id: "PCFO-015-COZ", local: "Rio de Janeiro, RJ", status: "Em trânsito", data: "02/08/2025" },
    { id: "KCDO-009-PSZ", local: "Rio de Janeiro, RJ", status: "Em trânsito", data: "01/08/2025" },
    { id: "PCDO-004-BSZ", local: "São Paulo, SP", status: "Atrasado", data: "08/08/2025" },
    { id: "PCDO-004-BSZ", local: "Rio de Janeiro, RJ", status: "Atrasado", data: "08/08/2025" },
    { id: "PCDO-004-BSZ", local: "São Paulo, SP", status: "Atrasado", data: "08/08/2025" },
  ];

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

  return (
    <div className="min-h-screen w-full bg-[#F2F6FB] flex">
      <Sidebar2 />
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
   
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div className="relative flex-1 max-w-full sm:max-w-4xl">
                        <input
                          type="text"
                          placeholder="Pesquisar por palavra-chave..."
                          value={pesquisa}
                          onChange={(e) => setPesquisa(e.target.value)}
                          className="w-full h-12 rounded-3xl bg-white pl-16 pr-4 text-sm focus:outline-none shadow-sm"
                        />
                        <img src={Pesquisa} alt="Pesquisar" className="w-5 h-5 absolute ml-6 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
        </div>

        <div className="bg-white rounded-3xl p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-xl font-bold font-GT text-azulEscuro">Relatórios</h1>
            <button className="bg-[#ECF2F9] text-azulEscuro font-medium rounded-2xl py-2 px-5 text-xs hover:bg-white duration-300">
              Exportar PDF
            </button>
          </div>

<div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
  
  <div className="lg:col-span-3 flex flex-col gap-6">
    
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <div className="bg-[#F2F6FB] p-6 rounded-3xl">
        <p className="text-sm text-azulEscuro font-medium">Total de cargas movimentadas</p>
        <div className="flex justify-between items-end mt-4">
          <p className="text-4xl lg:text-5xl font-GT text-[#3E41C0]">2.008</p>
          <img src={Grafico} alt="Gráfico" className="w-16 h-16" />
        </div>
      </div>
      <div className="bg-[#F2F6FB] p-6 rounded-3xl">
        <p className="text-sm text-azulEscuro font-medium">Tempo médio de entrega</p>
        <div className="flex justify-between items-end mt-4">
          <p className="text-4xl lg:text-5xl font-GT text-[#3E41C0]">3.5 dias</p>
          <img src={Horario} alt="Horário" className="w-16 h-16" />
        </div>
      </div>
    </div>

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
          {dadosTabela.map((item, index) => (
            <tr key={index}>
              <td className="py-4 px-4 text-center font-regular text-azulEscuro">{item.id}</td>
              <td className="py-4 px-4 text-center text-[#2B2B2B]">{item.local}</td>
              <td className="py-4 px-4 text-center">
                <span className={`font-regular ${getStatusClass(item.status)}`}>
                  {item.status}
                </span>
              </td>
              <td className="text-center py-4 px-4 text-[#2B2B2B]">{item.data}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>

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