// Front-End/src/Pages/FormNavio.jsx
import { useState } from "react";
import Sidebar2 from "../Components/Sidebar2";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import "react-datepicker/dist/react-datepicker.css";


const FormNavio = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    idCod: "",
    nome: "",
    capacidade: "",
    navio: "",
    container: "",
    sensores: { temperatura: false, umidade: false, movimento: false, localizacao: false },
    ativo: true,
    bandeira: "",
    status: "",
    statusfuturo: "",
    origem: "",
    destino: "",
    saida: "",
    eta: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggle = () => {
    setFormData((prev) => ({ ...prev, ativo: !prev.ativo }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const r = await apiFetch("/api/v1/ships", {
        method: "POST",
        auth: true,
        body: {
          name: formData.nome,
          imo: formData.idCod,
          flag: formData.bandeira,
          status: formData.status,
          statusfuturo: formData.statusfuturo || null,
          from_port: formData.origem,
          to_port: formData.destino,
          eta_date: formData.eta,
          departure_at: formData.saida ? new Date(formData.saida).toISOString() : null,
          active: Boolean(formData.ativo)
        }
      });
      const shipId = r?.ship_id ?? r?.id;
      if (shipId) {
        navigate(`/DetalhesNavio?id=${shipId}`);
      } else {
        navigate("/Navios");
      }
    } catch (err) {
      alert(err.message || "Erro ao cadastrar");
    }
  }

  const statusOptions = ["Em viagem", "Ancorado", "Manutenção"];

  return (
    <div className="min-h-screen w-full bg-deletar flex flex-row">
      <Sidebar2 />

      <div className="flex flex-col items-center justify-center w-full px-6 max-[760px]:mt-20">
        <h2 className="text-2xl font-GT text-azulEscuro mb-6 text-center">Cadastrar um Navio</h2>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl">
  
          <div className="mb-8">
            <label className="block text-sm text-azulEscuro mb-2">Código de Identificação (IMO)</label>
            <input
              type="text"
              name="idCod"
              placeholder="Insira o código de identificação . . ."
              value={formData.idCod}
              onChange={handleChange}
              className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium
              focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm text-azulEscuro mb-2">Nome do Navio</label>
            <input
              type="text"
              name="nome"
              placeholder="Insira o nome do navio . . ."
              value={formData.nome}
              onChange={handleChange}
              className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium
              focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm text-azulEscuro mb-2">Bandeira</label>
            <input
              type="text"
              name="bandeira"
              placeholder="Insira a bandeira . . ."
              value={formData.bandeira}
              onChange={handleChange}
              className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium
              focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50"
            />
          </div>

          <div className="mb-8 relative">
            <label className="block text-sm text-azulEscuro mb-2">Status</label>
            <Menu>
              <MenuButton
                className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo flex items-center justify-between
                focus:outline-none focus:ring-2 focus:ring-violeta"
              >
                {formData.status || "Selecione o status"}
                <svg
                  className="w-6 h-6 text-violeta ml-6 pointer-events-none"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </MenuButton>
              <MenuItems className="absolute mt-2 w-full rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                {statusOptions.map((status) => (
                  <MenuItem key={status}>
                    {({ focus }) => (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, status }))}
                        className={`w-full text-left px-4 py-2 text-sm rounded-xl ${
                          focus ? "bg-[#9F9CE8] text-white" : "text-azulEscuro"
                        }`}
                      >
                        {status}
                      </button>
                    )}
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
          </div>

          <div className="mb-8 relative">
            <label className="block text-sm text-azulEscuro mb-2">Próximo status (status futuro)</label>
            <Menu>
              <MenuButton
                className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo flex items-center justify-between
                focus:outline-none focus:ring-2 focus:ring-violeta"
              >
                {formData.statusfuturo || "Selecione o próximo status"}
                <svg
                  className="w-6 h-6 text-violeta ml-6 pointer-events-none"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </MenuButton>
              <MenuItems className="absolute mt-2 w-full rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                {statusOptions.map((statusfuturo) => (
                  <MenuItem key={statusfuturo}>
                    {({ focus }) => (
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, statusfuturo }))}
                        className={`w-full text-left px-4 py-2 text-sm rounded-xl ${
                          focus ? "bg-[#9F9CE8] text-white" : "text-azulEscuro"
                        }`}
                      >
                        {statusfuturo}
                      </button>
                    )}
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Origem</label>
              <input
                type="text"
                name="origem"
                value={formData.origem}
                onChange={handleChange}
                className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo
                focus:outline-none focus:ring-2 focus:ring-violeta"
              />
            </div>
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Destino</label>
              <input
                type="text"
                name="destino"
                value={formData.destino}
                onChange={handleChange}
                className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo
                focus:outline-none focus:ring-2 focus:ring-violeta"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div>
              <p className="text-sm mb-2 text-azulEscuro">Saída</p>
              <input
                type="datetime-local"
                name="saida"
                value={formData.saida}
                onChange={handleChange}
                className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo
                focus:outline-none focus:ring-2 focus:ring-violeta"
              />
            </div>
            <div>
              <p className="text-sm mb-2 text-azulEscuro">ETA</p>
              <input
                type="date"
                name="eta"
                value={formData.eta}
                onChange={handleChange}
                className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo
                focus:outline-none focus:ring-2 focus:ring-violeta"
              />
            </div>
          </div>

          <div className="mb-12">
            <p className="text-sm mb-6 text-azulEscuro">Ativo</p>
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

          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-6">
            <button
              type="button"
              onClick={() => navigate("/Navios")}
              className="w-full sm:w-36 h-10 rounded-xl font-medium text-[14px]
              bg-[#ECF2F9] text-[#5B61B3] hover:bg-slate-200 duration-300"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="w-full sm:w-36 h-10 rounded-xl font-normal bg-violeta text-white text-[14px]
              hover:bg-roxo duration-300"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormNavio;
