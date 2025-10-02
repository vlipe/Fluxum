import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import ListaIcone from "../assets/assetsLista/lista.svg";
import Lixeira from "../assets/assetsLista/lixeira.svg";
import Caneta from "../assets/assetsLista/caneta.svg";
import Sidebar2 from "../Components/Sidebar2";
import { useNavigate } from "react-router-dom";

const Lista = () => {
  const navigate = useNavigate(); 
  const dispositivos = [
    { id: "12345", nome: "IoT 1", navio: "Navio Deutsch", status: "Ativo", atualizado: "6h atrás" },
    { id: "67890", nome: "IoT 2", navio: "Navio Bernardino", status: "Inativo", atualizado: "10d atrás" },
    { id: "18002", nome: "IoT 3", navio: "Navio Vivencio", status: "Ativo", atualizado: "9h atrás" },
    { id: "20091", nome: "IoT 4", navio: "Navio Rodrigues", status: "Ativo", atualizado: "12m atrás" },
  ];

  return (
    <div className="min-h-screen w-full bg-deletar flex flex-row">
      <Sidebar2 />

      <div className="flex flex-col items-center justify-center w-full px-6">
    
        <h2 className="text-xl font-GT text-azulEscuro mb-6 text-center">
          Lista de Dispositivos
        </h2>

        <div className="bg-white rounded-3xl p-6 w-full max-w-5xl relative shadow-sm">

          <div className="absolute right-6 top-8">
            <Menu>
              <MenuButton className="flex items-center gap-4 bg-[#ECF2F9] rounded-[50px] px-6 py-3 text-sm font-medium text-azulEscuro">
                <img src={ListaIcone} alt="filtro" className="w-4 h-4" />
                Filtrar
              </MenuButton>
              <MenuItems className="absolute right-0 mt-2 w-40 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                {["A - Z", "Atv. recente", "Ativos", "Inativos"].map((filtro) => (
                  <MenuItem key={filtro}>
                    {({ focus }) => (
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2 text-sm rounded-xl ${
                          focus ? "bg-[#9F9CE8] text-white" : "text-azulEscuro"
                        }`}
                      >
                        {filtro}
                      </button>
                    )}
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-azulEscuro text-sm font-semibold bg-[#EEF3FB] rounded-3xl">
                  <th className="py-3 px-8 text-left rounded-l-3xl">ID</th>
                  <th className="py-3 px-4 text-left">Nome</th>
                  <th className="py-3 px-4 text-left">Navio</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left rounded-r-3xl">Atualização</th>
                </tr>
              </thead>
              <tbody>
                {dispositivos.map((d, i) => (
                  <tr
                    key={d.id}
                    className={`text-sm ${i % 2 === 0 ? "bg-[#ECF2F9]" : "bg-white"} rounded-3xl`}
                  >
                    <td className="px-8 py-3 rounded-l-3xl">{d.id}</td>
                    <td className="px-4 py-3">{d.nome}</td>
                    <td className="px-4 py-3">{d.navio}</td>
                    <td
                      className={`px-4 py-3 ${
                        d.status === "Ativo" ? "text-[#3BB61F]" : "text-[#F21D4E]"
                      }`}
                    >
                      {d.status}
                    </td>
                    <td className="px-4 py-3 rounded-r-3xl">{d.atualizado}</td>
                    <td className="px-4 py-3 flex justify-between bg-white">
                      <button className="p-2 rounded-xl bg-[#ECF2F9] hover:bg-transparent transition">
                        <img src={Caneta} alt="editar" className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-xl bg-[#ECF2F9] hover:bg-transparent transition">
                        <img src={Lixeira} alt="deletar" className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-6">
            <button
              type="button" onClick={() => navigate("/dashboard")}
              className="w-full sm:w-36 h-10 rounded-xl font-medium text-[14px] bg-[#ECF2F9] text-[#5B61B3] hover:bg-slate-200 duration-300"
            >
              Voltar
            </button>
            <button
              type="submit" onClick={() => navigate("/FormCad")}
              className="w-full sm:w-36 h-10 rounded-xl font-medium bg-violeta text-white text-[14px] hover:bg-roxo duration-300"
            >
              Cadastrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Lista;
