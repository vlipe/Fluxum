import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import ListaIcone from "../assets/assetsLista/lista.svg";
import Lixeira from "../assets/assetsLista/lixeira.svg";
import Caneta from "../assets/assetsLista/caneta.svg";
import Sidebar2 from "../Components/Sidebar2";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";

const DetalhesConteiner = () => {
  const navigate = useNavigate();

  const [containeres, setContainer] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);


 async function carregar() {
  setLoading(true);
  try {
    const rows = await apiFetch(`/api/v1/containers`, { auth: true });
    const mapped = rows.map(r => {
  const isActive =
    r.active === true ||
    r.active === 'true' ||
    r.active === 't' ||
    r.active === 1;
  return {
    id: r.id,
    status: isActive ? "Ativo" : "Inativo",
    navio: r.imo || "-",
    descricao: r.description || "-",
    temperatura: r.container_type?.toLowerCase().includes("reef") ? "-" : "N/A",
  };
});

    setContainer(mapped);
  } catch (e) {
    alert(e.message || "Erro ao carregar containers");
  } finally {
    setLoading(false);
  }
}


  useEffect(() => { carregar(); }, []);

  const filtros = ["A - Z", "Ativos", "Inativos", "Refrigeração"];

  return (
    <div className="min-h-screen w-full bg-deletar flex flex-row">
      <Sidebar2 />

      <div className="flex flex-col items-center justify-center w-full px-6">
        <h2 className="text-xl font-GT text-azulEscuro mb-6 text-center">
          Lista de Contêineres
        </h2>

        <div className="bg-white rounded-3xl p-6 w-full max-w-6xl relative shadow-sm">

          <div className="absolute right-6 top-8">
            <Menu>
              <MenuButton className="flex items-center gap-4 rounded-[50px] px-6 py-4 text-sm font-medium text-azulEscuro">
                <img src={ListaIcone} alt="filtro" className="w-4 h-4" />
                Filtrar
              </MenuButton>
              <MenuItems className="absolute right-0 mt-2 w-40 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                {filtros.map((filtro) => (
                  <MenuItem key={filtro}>
                    {({ focus }) => (
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2 text-sm rounded-xl ${focus ? "bg-[#9F9CE8] text-white" : "text-azulEscuro"
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

          {/* Tabela */}
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-azulEscuro text-sm font-semibold bg-[#EEF3FB] rounded-3xl">
                  <th className="py-3 px-8 text-left rounded-l-3xl">ID</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Navio</th>
                  <th className="py-3 px-4 text-left">Descrição</th>
                  <th className="py-3 px-4 text-left rounded-r-3xl">Temperatura</th>
                </tr>
              </thead>
              <tbody>
                {(!loading ? containeres : []).map((c, i) => (
                  <tr
                    key={c.id}
                    className={`text-sm ${i % 2 === 0 ? "bg-[#ECF2F9]" : "bg-white"
                      } rounded-3xl`}

                    onClick={(e) => {

                      if ((e.target.closest("button"))) return;
                      setSelected(c);

                    }}

                    style={{ cursor: "pointer" }}
                  >
                    <td className="px-8 py-3 rounded-l-3xl">{c.id}</td>
                    <td
                      className={`px-4 py-3 font-semibold ${c.status === "Ativo"
                          ? "text-[#3BB61F]"
                          : "text-[#F21D4E]"
                        }`}
                    >
                      {c.status}
                    </td>
                    <td className="px-4 py-3">{c.navio}</td>
                    <td className="px-4 py-3">{c.descricao}</td>
                    <td className="px-4 py-3 rounded-r-3xl">{c.temperatura}</td>
                    <td className="px-4 py-3 flex gap-3 justify-between bg-white">
                      <button
                        className="p-2 rounded-xl bg-[#ECF2F9] hover:bg-transparent transition"


                        onClick={() => navigate(`/FormConteiner?id=${encodeURIComponent(c.id)}${c.navio ? `&imo=${encodeURIComponent(c.navio)}` : ''}`)}
                      >
                        <img src={Caneta} alt="editar" className="w-4 h-4" />
                      </button>
                      <button className="p-2 rounded-xl bg-[#ECF2F9] hover:bg-transparent transition"

                        onClick={async () => {
                          if (!confirm(`Excluir container ${c.id}?`)) return;

                          try {
                            await apiFetch(`/api/v1/containers/${encodeURIComponent(c.id)}`, { method: "DELETE", auth: true });
                            await carregar();
                          } catch (e) {
                            alert(e.message || "Erro ao excluir");
                          }
                        }}

                      >

                        <img src={Lixeira} alt="deletar" className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {loading && (
                  <tr><td className="px-8 py-6 text-sm text-azulEscuro/70" colSpan={6}>Carregando...</td></tr>
                )}
                {!loading && containeres.length === 0 && (
                  <tr><td className="px-8 py-6 text-sm text-azulEscuro/70" colSpan={6}>Nenhum container cadastrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-6">
            <button
              type="button"
              onClick={() => navigate("/Navios")}
              className="w-full sm:w-36 h-10 rounded-xl font-medium text-[14px] bg-[#ECF2F9] text-[#5B61B3] hover:bg-slate-200 duration-300"
            >
              Voltar
            </button>
            <button
              type="submit"
              onClick={() => navigate("/FormConteiner")}
              className="w-full sm:w-36 h-10 rounded-xl font-normal bg-violeta text-white text-[14px] hover:bg-roxo duration-300"
            >
              Novo Contêiner
            </button>
          </div>
        </div>
      </div>

      {/* modal da table, simples */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-azulEscuro mb-4">Contêiner {selected.id}</h3>
            <div className="space-y-2 text-sm">
              <div><span className="font-semibold">IMO:</span> {selected.navio}</div>
              <div><span className="font-semibold">Status:</span> {selected.status}</div>
              <div><span className="font-semibold">Descrição:</span> {selected.descricao}</div>
              <div><span className="font-semibold">Temperatura:</span> {selected.temperatura}</div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="px-4 h-10 rounded-xl bg-[#ECF2F9] text-[#5B61B3]" onClick={() => setSelected(null)}>Fechar</button>
              <button
                className="px-4 h-10 rounded-xl bg-violeta text-white"
                onClick={() => {
                  setSelected(null);
                  navigate(`/FormConteiner?id=${encodeURIComponent(selected.id)}${selected.navio ? `&imo=${encodeURIComponent(selected.navio)}` : ''}`);
                }}
              >
                Editar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalhesConteiner;
