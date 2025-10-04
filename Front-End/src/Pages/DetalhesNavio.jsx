import { useEffect, useState } from "react";
import Sidebar2 from "../Components/Sidebar2";
import Informacao from "../assets/assetsNavios/informacao.svg";
import Container from "../assets/assetsNavios/container.svg";
import Caneta from "../assets/assetsLista/caneta.svg";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";

const DetalheNavio = () => {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const id = sp.get("id");
  const [ship, setShip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    if (!id) { setLoading(false); return; }
    apiFetch(`/api/v1/ships/${id}`, { auth: true })
      .then(r => { if (live) setShip(r || null); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [id]);

  function fmtDateTime(dt) {
    if (!dt) return "—";
    const d = new Date(dt);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  }

  function fmtDate(dy) {
    if (!dy) return "—";
    const d = new Date(dy);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full flex bg-[#ECF2F9]">
        <Sidebar2 />
        <div className="flex-1 p-6 lg:p-10">Carregando...</div>
      </div>
    );
  }

  if (!ship) {
    return (
      <div className="min-h-screen w-full flex bg-[#ECF2F9]">
        <Sidebar2 />
        <div className="flex-1 p-6 lg:p-10">
          <div className="bg-white rounded-2xl shadow-sm p-8 text-center">Navio não encontrado</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-[#ECF2F9]">
      <Sidebar2 />

      <div className="flex-1 p-6 lg:p-10">
        <h1 className="text-center text-xl lg:text-2xl font-GT font-bold text-azulEscuro mb-6">
          Detalhe do Navio
        </h1>

        <div className="bg-white rounded-2xl shadow-sm p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-GT font-bold text-azulEscuro">
                  {ship.name}
                </h2>
                <img src={Caneta} onClick={() => navigate(`/EditarNavio?id=${ship.ship_id}`)} alt="editar" className="w-5 h-5 cursor-pointer" />
              </div>

              <button
                type="button"
                onClick={() => navigate("/Navios")}
                className="bg-[#ECF2F9] text-azulEscuro text-[12px] font-medium px-6 py-2 rounded-full hover:bg-white duration-300"
              >
                Nova Viagem
              </button>
            </div>

            <p className="text-azulEscuro font-medium mt-2">Cód: {ship.imo || "—"}</p>

            <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm mt-6">
              <iframe
                title="mapa"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.4828539605663!2d-46.63587852378939!3d-23.58693676251227!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce5a28aa7ea6ab%3A0x55b0c7a9df8333d4!2sETEC%20Zona%20Leste!5e0!3m2!1spt-BR!2sbr!4v1700000000000"
                className="w-full h-[250px] sm:h-[300px] lg:h-[400px]"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
              ></iframe>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div>
              <h4 className="text-[#494594] flex items-center gap-2 mt-2 mb-6">
                <img src={Informacao} alt="informação" className="w-5 h-5" />
                Informações da Viagem
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-[#ECF2F9] rounded-3xl px-8 py-6 flex flex-col gap-4">
                  <p>
                    <span className="font-semibold text-azulEscuro">Origem:</span>{" "}
                    {ship.from_port || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-azulEscuro">Saída:</span>{" "}
                    {fmtDateTime(ship.departure_at)}
                  </p>
                </div>
                <div className="bg-[#ECF2F9] rounded-3xl px-8 py-6 flex flex-col gap-4">
                  <p>
                    <span className="font-semibold text-azulEscuro">Destino:</span>{" "}
                    {ship.to_port || "—"}
                  </p>
                  <p>
                    <span className="font-semibold text-azulEscuro">ETA:</span>{" "}
                    {fmtDate(ship.eta_date)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[#494594] flex items-center gap-2 mb-3">
                <img src={Container} alt="container" className="w-5 h-5" />
                Contêineres a Bordo
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm bg-deletar rounded-3xl pb-8">
                  <thead>
                    <tr className="text-left text-azulEscuro">
                      <th className="px-16 py-3">ID</th>
                      <th className="px-10 py-3">Status</th>
                      <th className="px-4 py-3">Última temp.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className>
                      <td className="px-16 py-3">12345</td>
                      <td className="px-10 py-3 text-[#3BB61F]">Ativo</td>
                      <td className="px-10 py-3">32,2° C</td>
                    </tr>
                    <tr>
                      <td className="px-16 py-3">67890</td>
                      <td className="px-10 py-3 text-[#F21D4E]">Inativo</td>
                      <td className="px-10 py-3">15,8° C</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetalheNavio;
