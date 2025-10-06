import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Sidebar2 from "../Components/Sidebar2";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";

const FormConteiner = () => {
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const shipId   = sp.get("ship_id");
  const imoParam = sp.get("imo");
  const idParam  = sp.get("id"); // quando editar

  const [formData, setFormData] = useState({
    id: "",
    description: "",
    imo: "",
    navio: "",
    owner: "",
    tipo: "",
    min_temp: "",
    max_temp: "",
    ativo: true,   // toggle
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = () => {
    setFormData((prev) => ({ ...prev, ativo: !prev.ativo }));
  };

  // carregar para editar
  useEffect(() => {
    if (!idParam) return;
    (async () => {
      try {
        const c = await apiFetch(`/api/v1/containers/${encodeURIComponent(idParam)}`, { auth: true });
        setFormData((prev) => ({
          ...prev,
          id: c.id || "",
          description: c.description || "",
          imo: c.imo || "",
          owner: c.owner || "",
          tipo: c.container_type || "",
          min_temp: c.min_temp ?? "",
          max_temp: c.max_temp ?? "",
          ativo: typeof c.active === "boolean" ? c.active : true,
        }));
      } catch (e) {
        alert(e.message || "Falha ao carregar contêiner");
      }
    })();
  }, [idParam]);

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const body = {
        ...(idParam ? {} : { id: formData.id }), 
        imo: (imoParam || formData.imo || "").trim(),
        container_type: formData.tipo || null,
        owner: formData.owner || null,
        description: formData.description || null,
        min_temp: formData.min_temp !== "" ? Number(formData.min_temp) : null,
        max_temp: formData.max_temp !== "" ? Number(formData.max_temp) : null,
        active: Boolean(formData.ativo),
        
      };
      

      if (idParam) {
        await apiFetch(`/api/v1/containers/${encodeURIComponent(idParam)}`, {
          method: "PUT",
          body,
          auth: true,
        });
      } else {
        await apiFetch(`/api/v1/containers`, {
          method: "POST",
          body,
          auth: true,
        });
      }

      if (shipId) {
        navigate(`/DetalhesNavio?id=${shipId}`);
      } else {
        navigate(`/DetalhesConteiner`);
      }
    } catch (err) {
      alert(err.message || "Falha ao salvar contêiner");
    }
  }

  return (
    <div className="min-h-screen w-full bg-deletar flex flex-row">
      <Sidebar2 />
      <div className="flex flex-col items-center justify-center w-full px-6">
        <h2 className="text-2xl font-GT text-azulEscuro mb-6 text-center">
          {idParam ? "Editar Contêiner" : "Cadastrar um Contêiner"}
        </h2>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl">
          {/* ID */}
          <div className="mb-8">
            <label className="block text-sm text-azulEscuro mb-2">Placa do Contêiner</label>
            <input
              type="text"
              name="id"
              placeholder="Insira a placa do contêiner . . ."
              value={formData.id}
              onChange={handleChange}
              disabled={!!idParam}
              className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50"
            />
          </div>

          {/* Descrição */}
          <div className="mb-8">
            <label className="block text-sm text-azulEscuro mb-2">Descrição do Contêiner</label>
            <textarea
              name="description"
              placeholder="Insira a descrição do contêiner (opcional) . . "
              value={formData.description}
              onChange={handleChange}
              className="w-full h-24 rounded-xl bg-[#F4F7FB] px-4 py-8 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50 resize-none"
            />
          </div>

          {/* IMO */}
          <div className="mb-8">
            <label className="block text-sm text-azulEscuro mb-2">Código de Identificação (IMO)</label>
            <input
              type="text"
              name="imo"
              placeholder="Insira o código IMO . . ."
              value={imoParam ?? formData.imo}
              onChange={handleChange}
              disabled={!!imoParam}
              className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50 disabled:opacity-70"
            />
          </div>

          {/* Tipo + Navio (navio aqui continua só visual/estático, igual estava) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Navio Vinculado</label>
              <Menu>
                <MenuButton className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-violeta">
                  {formData.navio || "Selecione o navio"}
                  <svg className="w-6 h-6 text-violeta ml-6 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd"/>
                  </svg>
                </MenuButton>
                <MenuItems className="absolute mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                  {["Estrela do Mar", "Cruzeiro do Sul", "Norte II"].map((navio) => (
                    <MenuItem key={navio}>
                      {({ focus }) => (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, navio }))}
                          className={`w-full text-left px-4 py-2 text-sm rounded-xl ${focus ? "bg-[#9F9CE8] text-white" : "text-azulEscuro"}`}
                        >
                          {navio}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            </div>

            <div>
              <label className="block text-sm text-azulEscuro mb-2">Tipo do Contêiner</label>
              <Menu>
                <MenuButton className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-violeta">
                  {formData.tipo || "Selecione o tipo"}
                  <svg className="w-6 h-6 text-violeta ml-6 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd"/>
                  </svg>
                </MenuButton>
                <MenuItems className="absolute mt-2 w-60 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                  {["Reefer (Refrigeração)", "Dry Van", "Tank", "Flat Rack", "Open Top", "Ventilado", "Graneleiro"].map((tipo) => (
                    <MenuItem key={tipo}>
                      {({ focus }) => (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, tipo }))}
                          className={`w-full text-left px-4 py-2 text-sm rounded-xl ${focus ? "bg-[#9F9CE8] text-white" : "text-azulEscuro"}`}
                        >
                          {tipo}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            </div>
          </div>

          {/* Min/Max temp (se quiser manter) */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Temperatura Mínima (°C)</label>
              <input
                type="number"
                name="min_temp"
                placeholder="Ex: -5"
                value={formData.min_temp}
                onChange={handleChange}
                className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Temperatura Máxima (°C)</label>
              <input
                type="number"
                name="max_temp"
                placeholder="Ex: 10"
                value={formData.max_temp}
                onChange={handleChange}
                className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50"
              />
            </div>
          </div>

          {/* Toggle Ativo (igual FormNavio) */}
          <div className="mb-8">
            <p className="text-sm mb-2 text-azulEscuro">Ativo</p>
            <button
              type="button"
              onClick={handleToggle}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                formData.ativo ? "bg-violeta" : "bg-[#ECF2F9]"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full transform transition-transform ${
                  formData.ativo ? "translate-x-6" : ""
                }`}
              ></div>
            </button>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-6">
            <button
              type="button"
              onClick={() => navigate(shipId ? `/DetalhesNavio?id=${shipId}` : "/Navios")}
              className="w-full sm:w-36 h-10 rounded-xl font-medium text-[14px] bg-[#ECF2F9] text-[#5B61B3] hover:bg-slate-200 duration-300"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="w-full sm:w-36 h-10 rounded-xl font-medium bg-violeta text-white text-[14px] hover:bg-roxo duration-300"
            >
              {idParam ? "Salvar" : "Cadastrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormConteiner;
