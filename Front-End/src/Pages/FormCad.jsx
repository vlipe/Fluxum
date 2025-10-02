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

const FormCad = () => {
    const navigate = useNavigate(); 

  const [formData, setFormData] = useState({
    idDispositivo: "",
    apelido: "",
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

  const handleCheckboxChange = (sensor) => {
    setFormData((prev) => ({
      ...prev,
      sensores: {
        ...prev.sensores,
        [sensor]: !prev.sensores[sensor],
      },
    }));
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
        Cadastrar Dispositivo IoT
      </h2>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl"
      >
        
        <div className="mb-8">
          <label className="block text-sm text-azulEscuro mb-2">
            ID do Dispositivo
          </label>
          <input
            type="text"
            name="idDispositivo"
            placeholder="Insira o ID do dispositivo . . ."
            value={formData.idDispositivo}
            onChange={handleChange}
            className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium
                       focus:outline-none focus:ring-2 focus:ring-violeta
                       placeholder:text-[#3E41C0] placeholder:opacity-50"
          />
        </div>

        <div className="mb-8">
          <label className="block text-sm text-azulEscuro mb-2">
            Nome ou Apelido
          </label>
          <input
            type="text"
            name="apelido"
            placeholder="Insira o apelido do dispositivo . . ."
            value={formData.apelido}
            onChange={handleChange}
            className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium
                       focus:outline-none focus:ring-2 focus:ring-violeta
                       placeholder:text-[#3E41C0] placeholder:opacity-50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">

          <div>
            <label className="block text-sm text-azulEscuro mb-2">
              Selecione o Navio
            </label>
            <Menu>
              <MenuButton
                className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo flex items-center justify-between
                          focus:outline-none focus:ring-2 focus:ring-violeta"
              >
                {formData.navio ? formData.navio : "ㅤㅤ"}
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
              <MenuItems className="absolute mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                {["Navio 1", "Navio 2"].map((navio) => (
                  <MenuItem key={navio}>
                    {({ focus }) => (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, navio }))
                        }
                        className={`w-full text-left px-4 py-2 text-sm rounded-xl ${
                          focus ? "bg-[#9F9CE8] text-white" : "text-azulEscuro"
                        }`}
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
            <label className="block text-sm text-azulEscuro mb-2">
              Selecione o Contêiner
            </label>
            <Menu>
              <MenuButton
                className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo flex items-center justify-between
                          focus:outline-none focus:ring-2 focus:ring-violeta"
              >
                {formData.container ? formData.container : "ㅤㅤ"}
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
              <MenuItems className="absolute mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
                {["Contêiner 1", "Contêiner 2"].map((container) => (
                  <MenuItem key={container}>
                    {({ focus }) => (
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, container }))
                        }
                        className={`w-full text-left px-4 py-2 text-sm rounded-xl ${
                          focus ? "bg-[#9F9CE8] text-white" : "text-azulEscuro"
                        }`}
                      >
                        {container}
                      </button>
                    )}
                  </MenuItem>
                ))}
              </MenuItems>
            </Menu>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm mb-4 text-azulEscuro">Tipo de Sensor</p>
          <div className="flex gap-6 flex-wrap">
            {["temperatura", "umidade", "movimento", "localização"].map(
              (sensor) => (
                <Checkbox
                  key={sensor}
                  label={sensor.charAt(0).toUpperCase() + sensor.slice(1)}
                  checked={formData.sensores[sensor]}
                  onChange={() => handleCheckboxChange(sensor)}
                />
              )
            )}
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
            type="button" onClick={() => navigate("/dashboard")}
            className="w-full sm:w-36 h-10 rounded-xl font-medium text-[14px] bg-[#ECF2F9] text-[#5B61B3] hover:bg-slate-200 duration-300"
          >
            Voltar
          </button>
          <button
            type="submit" onClick={() => navigate("/Lista")}
            className="w-full sm:w-36 h-10 rounded-xl font-medium bg-violeta text-white text-[14px] hover:bg-roxo duration-300"
          >
            Cadastrar
          </button>
        </div>
      </form>
    </div>
    </div>
  );  
};

export default FormCad;
