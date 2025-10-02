import { useEffect, useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import Sidebar2 from "../Components/Sidebar2";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";

const Checkbox = ({ label, checked, onChange }) => {
  return (
    <label className="flex items-center gap-6 mr-4 text-[12px] cursor-pointer select-none">
      <input type="checkbox" checked={checked} onChange={onChange} className="hidden peer" />
      <span className="w-6 h-6 rounded-md bg-[#ECF2F9] peer-checked:bg-[#9F9CE8] flex items-center justify-center transition-colors">
        <svg className="w-3 h-3 text-white hidden peer-checked:block" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </span>
      {label}
    </label>
  );
};

const EditarNavio = () => {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const id = sp.get("id");
  const [formData, setFormData] = useState({
    idCod: "",
    nome: "",
    capacidade: "",
    navio: "",
    container: "",
    sensores: { temperatura: false, umidade: false, movimento: false, localizacao: false },
    ativo: false,
    bandeira: "",
    status: "",
    origem: "",
    destino: "",
    saida: "",
    eta: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let live = true;
    if (!id) { setLoading(false); return; }
    apiFetch(`/api/v1/ships/${id}`)
      .then(r => {
        if (!live) return;
        setFormData(s => ({
          ...s,
          idCod: r?.imo || "",
          nome: r?.name || "",
          bandeira: r?.flag || "",
          status: r?.status || "",
          origem: r?.from_port || "",
          destino: r?.to_port || "",
          saida: r?.departure_at ? String(r.departure_at).slice(0,16) : "",
          eta: r?.eta_date ? String(r.eta_date).slice(0,10) : ""
        }));
      })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      await apiFetch(`/api/v1/ships/${id}`, {
        method: "PUT",
        body: {
          name: formData.nome,
          imo: formData.idCod,
          flag: formData.bandeira,
          status: formData.status,
          from_port: formData.origem,
          to_port: formData.destino,
          eta_date: formData.eta,
          departure_at: formData.saida ? new Date(formData.saida).toISOString() : null
        }
      });
      navigate(`/DetalhesNavio?id=${id}`);
    } catch (e2) {
      alert(e2.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="min-h-screen w-full bg-deletar flex flex-row"><Sidebar2 /><div className="flex-1 p-6">Carregando...</div></div>;

  return (
    <div className="min-h-screen w-full bg-deletar flex flex-row">
      <Sidebar2 />
      <div className="flex flex-col items-center justify-center w-full px-6">
        <h2 className="text-2xl font-GT text-azulEscuro mb-6 text-center">Editar Navio</h2>
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl">
          <div className="mb-8">
            <label className="block text-sm text-azulEscuro mb-2">Código de Identificação (IMO)</label>
            <input type="text" name="idCod" placeholder="Insira o código de identificação . . ." value={formData.idCod} onChange={handleChange} className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50" />
          </div>

          <div className="mb-8">
            <label className="block text-sm text-azulEscuro mb-2">Nome do Navio</label>
            <input type="text" name="nome" placeholder="Insira o nome do navio . . ." value={formData.nome} onChange={handleChange} className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50" />
          </div>

          <div className="mb-8">
            <label className="block text-sm text-azulEscuro mb-2">Bandeira</label>
            <input type="text" name="bandeira" placeholder="Insira a bandeira . . ." value={formData.bandeira} onChange={handleChange} className="w-full h-12 rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-[#3E41C0] font-medium focus:outline-none focus:ring-2 focus:ring-violeta placeholder:text-[#3E41C0] placeholder:opacity-50" />
          </div>

          <div className="mb-8">
            <label className="block text-sm text-azulEscuro mb-2">Status</label>
            <select name="status" value={formData.status} onChange={handleChange} className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo focus:outline-none focus:ring-2 focus:ring-violeta">
              <option value="">Selecione</option>
              <option value="Em viagem">Em viagem</option>
              <option value="Ancorado">Ancorado</option>
              <option value="Manutenção">Manutenção</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Origem</label>
              <input type="text" name="origem" value={formData.origem} onChange={handleChange} className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo focus:outline-none focus:ring-2 focus:ring-violeta" />
            </div>
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Destino</label>
              <input type="text" name="destino" value={formData.destino} onChange={handleChange} className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo focus:outline-none focus:ring-2 focus:ring-violeta" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Saída</label>
              <input type="datetime-local" name="saida" value={formData.saida} onChange={handleChange} className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo focus:outline-none focus:ring-2 focus:ring-violeta" />
            </div>
            <div>
              <label className="block text-sm text-azulEscuro mb-2">ETA</label>
              <input type="date" name="eta" value={formData.eta} onChange={handleChange} className="h-12 w-full rounded-xl bg-[#F4F7FB] px-4 text-[13px] text-roxo focus:outline-none focus:ring-2 focus:ring-violeta" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 mt-6">
            <button type="button" onClick={() => navigate(`/DetalhesNavio?id=${id}`)} className="w-full sm:w-36 h-10 rounded-xl font-medium text-[14px] bg-[#ECF2F9] text-[#5B61B3] hover:bg-slate-200 duration-300">Voltar</button>
            <button type="submit" disabled={saving} className="w-full sm:w-36 h-10 rounded-xl font-medium bg-violeta text-white text-[14px] hover:bg-roxo duration-300">{saving ? "Salvando..." : "Salvar"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarNavio;
