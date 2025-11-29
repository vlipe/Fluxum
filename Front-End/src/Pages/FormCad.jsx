import { useState, useEffect } from "react";
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

  // Listas que virão do Banco de Dados
  const [listaNavios, setListaNavios] = useState([]);
  const [listaContainers, setListaContainers] = useState([]);

  // Estado do Formulário
  const [formData, setFormData] = useState({
    idDispositivo: "",
    apelido: "",
    navioSelecionado: null,    
    containerSelecionado: null, 
    sensores: {
      temperatura: false,
      umidade: false,
      localizacao: false,
    },
    ativo: true,
  });

  // Recupera o Token
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

  // --- FUNÇÃO PARA FORMATAR MAC ADDRESS ---
  const formatMacAddress = (value) => {
    // 1. Remove tudo que não for letra (A-F) ou número
    const cleanValue = value.replace(/[^a-fA-F0-9]/g, "").toUpperCase();
    
    // 2. Adiciona os dois pontos a cada 2 caracteres
    // O regex (.{2}) pega cada 2 chars e adiciona ':' depois, exceto no final
    let formatted = cleanValue.match(/.{1,2}/g)?.join(":") || cleanValue;
    
    // 3. Corta para garantir o tamanho máximo de um MAC (17 caracteres)
    return formatted.substring(0, 17);
  };

  // --- BUSCAR DADOS DA API ---
  useEffect(() => {
    if (!token) {
        alert("Sessão expirada. Faça login novamente.");
        navigate("/login"); 
        return;
    }

    const fetchData = async () => {
      try {
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
        };

        const resShips = await fetch("http://localhost:3000/api/v1/ships", { headers });
        if (resShips.ok) {
            const dataShips = await resShips.json();
            setListaNavios(Array.isArray(dataShips) ? dataShips : []);
        }

        const resCont = await fetch("http://localhost:3000/api/v1/containers", { headers });
        if (resCont.ok) {
            const dataCont = await resCont.json();
            setListaContainers(Array.isArray(dataCont) ? dataCont : []);
        }

      } catch (error) {
        console.error("Erro de conexão:", error);
      }
    };

    fetchData();
  }, [token, navigate]);

  // --- HANDLE CHANGE COM MÁSCARA ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "idDispositivo") {
      // Aplica a máscara se for o campo do ID
      setFormData((prev) => ({ ...prev, [name]: formatMacAddress(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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

  // --- ENVIAR DADOS ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!token) {
        alert("Erro de autenticação.");
        return;
    }

    try {
      const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      };

      // Passo A: Cadastrar Dispositivo
      const devicePayload = {
        device_id: formData.idDispositivo, 
        alias: formData.apelido,
        model: "ESP32-Standard",
        metadata: { sensores: formData.sensores } 
      };

      const resDevice = await fetch("http://localhost:3000/api/v1/devices", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(devicePayload),
      });

      if (!resDevice.ok) {
        const err = await resDevice.json();
        throw new Error(err.error || "Erro ao criar dispositivo");
      }

      // Passo B: Associar ao Container
      if (formData.containerSelecionado) {
        const containerId = formData.containerSelecionado.id;
        
        await fetch(`http://localhost:3000/api/v1/containers/${containerId}/devices/attach`, {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ device_id: formData.idDispositivo }),
        });
      }

      alert("Dispositivo cadastrado e associado com sucesso!");
      navigate("/Lista"); 

    } catch (error) {
      console.error("Erro no cadastro:", error);
      alert(`Erro: ${error.message}`);
    }
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
              ID do Dispositivo (MAC Address)
            </label>
            <input
              type="text"
              name="idDispositivo"
              maxLength={17} // Limita o tamanho visualmente
              placeholder="Ex: 5C:01:3B:4B:EF:60"
              value={formData.idDispositivo}
              onChange={handleChange}
              className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50"
            />
          </div>

          <div className="mb-8">
            <label className="block text-sm text-azulEscuro mb-2">
              Nome ou Apelido
            </label>
            <input
              type="text"
              name="apelido"
              placeholder="Ex: Sensor Temperatura 01"
              value={formData.apelido}
              onChange={handleChange}
              className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {/* Dropdown de Navios */}
            <div>
              <label className="block text-sm text-azulEscuro mb-2">
                Selecione o Navio
              </label>
              <Menu>
                <MenuButton className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-violeta">
                  {formData.navioSelecionado ? formData.navioSelecionado.name : "Selecione..."}
                  <svg className="w-6 h-6 text-violeta ml-6 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                  </svg>
                </MenuButton>
                <MenuItems className="absolute mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10 max-h-60 overflow-y-auto">
                  {listaNavios.map((navio) => (
                    <MenuItem key={navio.ship_id}>
                      {({ focus }) => (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, navioSelecionado: navio }))}
                          className={`w-full text-left px-4 py-2 text-sm rounded-xl ${focus ? "bg-[#9F9CE8] text-white" : "text-azulEscuro"}`}
                        >
                          {navio.name}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            </div>

            {/* Dropdown de Containers */}
            <div>
              <label className="block text-sm text-azulEscuro mb-2">
                Selecione o Contêiner
              </label>
              <Menu>
                <MenuButton className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-violeta">
                  {formData.containerSelecionado ? formData.containerSelecionado.id : "Selecione..."}
                  <svg className="w-6 h-6 text-violeta ml-6 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.25 8.27a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                  </svg>
                </MenuButton>
                <MenuItems className="absolute mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10 max-h-60 overflow-y-auto">
                  {listaContainers.map((container) => (
                    <MenuItem key={container.id}>
                      {({ focus }) => (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, containerSelecionado: container }))}
                          className={`w-full text-left px-4 py-2 text-sm rounded-xl ${focus ? "bg-[#9F9CE8] text-white" : "text-azulEscuro"}`}
                        >
                          {container.id}
                        </button>
                      )}
                    </MenuItem>
                  ))}
                </MenuItems>
              </Menu>
            </div>
          </div>

          {/* Restante do código (Checkboxes e Botões) continua igual */}
          <div className="mb-6">
            <p className="text-sm mb-4 text-azulEscuro">Tipo de Sensor</p>
            <div className="flex gap-6 flex-wrap">
              {["temperatura", "umidade", "localização"].map(
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
              type="button"
              onClick={() => navigate("/dashboard")}
              className="w-full sm:w-36 h-10 rounded-xl font-medium text-[14px] bg-[#ECF2F9] text-[#5B61B3] hover:bg-slate-200 duration-300"
            >
              Voltar
            </button>
            <button
              type="submit"
              className="w-full sm:w-36 h-10 rounded-xl font-normal bg-violeta text-white text-[14px] hover:bg-roxo duration-300"
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