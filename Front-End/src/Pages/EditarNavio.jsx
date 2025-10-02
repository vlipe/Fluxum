import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Sidebar2 from "../Components/Sidebar2";
import { useNavigate } from "react-router-dom";

const Checkbox = ({ label, checked, onChange }) => {

  return (
    <label className="flex items-center gap-6 mr-4 text-[12px] cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="hidden peer"
      />
      <span
        className="
          w-6 h-6 rounded-md 
          bg-[#ECF2F9] 
          peer-checked:bg-[#9F9CE8] 
          flex items-center justify-center
          transition-colors
        "
      >
        <svg
          className="w-3 h-3 text-white hidden peer-checked:block"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
      {label}
    </label>
  );
};

const EditarNavio = () => {
    const navigate = useNavigate(); 
    
  const [formData, setFormData] = useState({
    idCod: "",
    nome: "",
    capacidade: "",
    navio: "",
    container: "",
    sensores: {
      temperatura: false,
      umidade: false,
      movimento: false,
      localizacao: false,
    },
    ativo: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleToggle = () => {
    setFormData((prev) => ({ ...prev, ativo: !prev.ativo }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form enviado:", formData);
  };

  return (
        <div className="min-h-screen w-full bg-deletar flex flex-row">
      <Sidebar2 />

<div className="flex flex-col items-center justify-center w-full px-6">

      <h2 className="text-2xl font-GT text-azulEscuro mb-6 text-center">
        Editar Navio
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl"
      >
        
        <div className="mb-8">
          <label className="block text-sm text-azulEscuro mb-2">
            Código de Identificação (IMO)
          </label>
          <input
            type="text"
            name="idCod"
            placeholder="Insira o código de identificação . . ."
            value={formData.idCod}
            onChange={handleChange}
            className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium
                       focus:outline-none focus:ring-2 focus:ring-violeta
                       placeholder:text-[#3E41C0] placeholder:opacity-50"
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm text-azulEscuro mb-2">
            Nome do Navio
          </label>
          <input
            type="text"
            name="nome"
            placeholder="Insira o nome do navio . . ."
            value={formData.apelido}
            onChange={handleChange}
            className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium
                       focus:outline-none focus:ring-2 focus:ring-violeta
                       placeholder:text-[#3E41C0] placeholder:opacity-50"
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm text-azulEscuro mb-2">
            Capacidade Máxima de Contêineres
          </label>
          <input
            type="text"
            name="capacidade"
            placeholder="Insira a capacidade máxima de contêineres . . ."
            value={formData.id}
            onChange={handleChange}
            className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium
                       focus:outline-none focus:ring-2 focus:ring-violeta
                       placeholder:text-[#3E41C0] placeholder:opacity-50"
          />
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
            type="button" onClick={() => navigate("/Navio")}
            className="w-full sm:w-36 h-10 rounded-xl font-medium text-[14px] bg-[#ECF2F9] text-[#5B61B3] hover:bg-slate-200 duration-300"
          >
            Voltar
          </button>
          <button
            type="submit" onClick={() => navigate("/DetalhesNavio")}
            className="w-full sm:w-36 h-10 rounded-xl font-medium bg-violeta text-white text-[14px] hover:bg-roxo duration-300"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
    </div>
  );  
};

export default EditarNavio;
