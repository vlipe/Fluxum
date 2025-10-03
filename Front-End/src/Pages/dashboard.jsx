import React, { useEffect, useMemo, useState } from "react";
import Sidebar2 from "../Components/Sidebar2";
import LigarIot from "../assets/assetsDashboard/LigarIot.svg";
import Termometro from "../assets/assetsDashboard/Frame 14.svg";
import Megafone from "../assets/assetsDashboard/Frame 15.svg";
import Caminhao from "../assets/assetsDashboard/Frame 16.svg";
import Pesquisa from "../assets/assetsAlertas/pesquisar.svg";
import { useNavigate } from "react-router-dom";

import { Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartJsTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler, 
} from "chart.js";
import { apiFetch } from "../lib/api";
import ConnectionBadge from "../Components/ConnectionBadge";

ChartJS.register(
  ArcElement,
  ChartJsTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler 
);

const transparentBackgroundPlugin = {
  id: "customCanvasBackgroundColor",
  beforeDraw: (chart) => {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

const centerTextPlugin = {
  id: "centerText",
  beforeDraw: (chart) => {
    const { width, height, ctx } = chart;
    ctx.save();
    const a = chart.config.data.datasets[0].data[0] || 0;
    const b = chart.config.data.datasets[0].data[1] || 0;
    const total = a + b || 1;
    const percentage = ((a / total) * 100).toFixed(0);
    const centerX = width / 2;
    const centerY = height / 2;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 28px 'GT Walsheim Pro', sans-serif";
    ctx.fillStyle = "#3E41C0";
    ctx.fillText(`${percentage}%`, centerX, centerY);
    ctx.restore();
  },
};

function timeAgo(iso) {
  try {
    const d = iso ? new Date(iso) : null;
    if (!d) return "—";
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)} min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  } catch {
    return "—";
  }
}


const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [pesquisa, setPesquisa] = useState("");
  const [summary, setSummary] = useState({
    containersCount: 0,
    cards: [],
    battery: { percent: null, duration_hours: null },
    temperature: { celsius: null },

    performance: { percentage_change: null, history: [] },
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await apiFetch("/api/v1/dashboard");
        if (!alive) return;
        setSummary(data || {});
      } catch {
    
        setSummary({
          containersCount: 0,
          cards: [],
          battery: { percent: null, duration_hours: null },
          temperature: { celsius: null },
          performance: { percentage_change: null, history: [] },
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const containersCount = summary?.containersCount ?? 101;
  const card1 = summary?.cards?.[0] || { label: "Temperatura acima do limite", ts_iso: new Date(Date.now() - 30 * 60 * 1000).toISOString() };
  const card2 = summary?.cards?.[1] || { label: "Rota inesperada detectado", ts_iso: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() };
  const card3 = summary?.cards?.[2] || { label: "Movimentação concluída", ts_iso: new Date(Date.now() - 5 * 60 * 1000).toISOString() };
  const iconFor = (label) => {
    if (label.includes("Temperatura")) return Termometro;
    if (label.includes("Rota inesperada")) return Megafone;
    if (label.includes("Movimentação concluída")) return Caminhao;
    return Caminhao;
  };
  const batteryPercent = Number.isFinite(+summary?.battery?.percent) ? Math.max(0, Math.min(100, +summary.battery.percent)) : 75;
  const batteryDurationHours = Number.isFinite(+summary?.battery?.duration_hours) ? +summary.battery.duration_hours : 10;
  
  const performanceData = summary?.performance || {
    percentage_change: 18.2,
    history: [65, 59, 80, 81, 56, 55, 90], 
  };

  const { percentage_change, history } = performanceData;
  const performanceColor = percentage_change >= 0 ? "text-[#3BB61F]" : "text-red-500";
  const performanceSign = percentage_change >= 0 ? "+" : "";

  const lineChartData = useMemo(() => ({
    labels: history.map(() => ''), 
    datasets: [
      {
        label: "Performance",
        data: history,
        fill: true,
        backgroundColor: "rgba(59, 182, 31, 0.2)",
        borderColor: "rgba(59, 182, 31, 1)",
        borderWidth: 2,
        tension: 0.4, 
        pointRadius: 0, 
      },
    ],
  }), [history]);

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false },
    },
    scales: {
      x: { display: false }, 
      y: { display: false },
    },
  };

  const termoBusca = pesquisa.toLowerCase().trim();
  const cardsDeBusca = {
    performance: `+${percentage_change}% performance gráfico`,
    iot: "conectar iot",
    movimentacoes: `movimentações ${containersCount}`,
    alertas: `alertas ${card1.label} ${card2.label} ${card3.label}`,
    bateria: "bateria da iot",
    mapa: "mapa prévia rota planejada localização",
  };
  const mostrarCard = (nomeCard) => {
    if (!termoBusca) return true;
    return cardsDeBusca[nomeCard].toLowerCase().includes(termoBusca);
  };
  const nenhumResultado = termoBusca && Object.keys(cardsDeBusca).every(card => !mostrarCard(card));

  const doughnutData = useMemo(() => ({
    labels: ["Bateria disponível", "Bateria consumida"],
    datasets: [
      {
        label: "%",
        data: [batteryPercent, 100 - batteryPercent],
        backgroundColor: ["#3E41C0", "#ECF2F9"],
        borderColor: ["#3E41C0", "#ECF2F9"],
        borderWidth: 0
      }
    ]
  }), [batteryPercent]);

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: { legend: { display: false }, tooltip: { enabled: true } }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#ECF2F9]">
      <Sidebar2 />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-[760px]:mt-8">
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <p className="text-xl text-azulEscuro">
            Oi, <span className="text-[#3E41C0] font-semibold">Felipe</span>!
          </p>
          <div className="relative flex-1 max-w-full sm:max-w-4xl">
            <input
              type="text"
              placeholder="Pesquisar por palavra-chave..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
              className="w-full h-12 rounded-3xl bg-white pl-16 pr-4 text-sm focus:outline-none shadow-sm max-[760px]:hidden"
            />
            <img src={Pesquisa} alt="Pesquisar" className="w-5 h-5 absolute ml-6 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 lg:p-8">
          <h1 className="text-xl font-bold font-GT text-azulEscuro mb-6">Dashboard</h1>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* 6. SUBSTITUIR a <img> pelo componente <Line> */}
                {mostrarCard('performance') && (
                  <div className="bg-[#ECF2F9] p-6 rounded-3xl flex flex-col justify-between">
                    <p className={`${performanceColor} text-lg font-semibold`}>
                      {loading ? "—" : `${performanceSign}${percentage_change}%`}
                    </p>
                    <div className="mt-4 h-20">
                      {!loading && history.length > 0 && (
                        <Line data={lineChartData} options={lineChartOptions} />
                      )}
                    </div>
                  </div>
                )}

                {/* O resto do seu JSX continua o mesmo... */}
                {(mostrarCard('iot') || mostrarCard('movimentacoes')) && (
                  <div className="flex flex-col gap-6">
                    {mostrarCard('iot') && (
                      <div onClick={() => navigate("/FormCad")} className="bg-[#ECF2F9] p-3 rounded-[30px] flex items-center justify-evenly cursor-pointer">
                        <img src={LigarIot} alt="Ligar IoT" className="-ml-6 w-12 h-12 sm:w-20 sm:h-20" />
                        <span className="text-azulEscuro text-base font-medium">Conectar IoT</span>
                      </div>
                    )}
                    {mostrarCard('movimentacoes') && (
                      <div className="bg-[#ECF2F9] p-6 rounded-[30px] flex items-center justify-evenly">
                        <p className="text-[#3E41C0] text-4xl sm:text-5xl font-GT font-bold">{loading ? "—" : containersCount}</p>
                        <p className="text-azulEscuro text-base font-medium">movimentações</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {mostrarCard('alertas') && (
                <div className="bg-[#ECF2F9] p-6 rounded-3xl flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <img src={iconFor(card1.label)} alt="Ícone de alerta" className="w-12 h-12" />
                      <span className="text-[#3E41C0] text-[14px]">{card1.label}</span>
                    </div>
                    <span className="text-roxo text-sm mr-4">{timeAgo(card1.ts_iso)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <img src={iconFor(card2.label)} alt="Ícone de alerta" className="w-12 h-12" />
                      <span className="text-[#3E41C0] text-[14px]">{card2.label}</span>
                    </div>
                    <span className="text-roxo text-sm mr-4">{timeAgo(card2.ts_iso)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <img src={iconFor(card3.label)} alt="Ícone de alerta" className="w-12 h-12" />
                      <span className="text-[#3E41C0] text-[14px]">{card3.label}</span>
                    </div>
                    <span className="text-roxo text-sm mr-4">{timeAgo(card3.ts_iso)}</span>
                  </div>
                </div>
              )}

              {mostrarCard('bateria') && (
                <div className="bg-[#ECF2F9] p-6 rounded-3xl flex items-center gap-6">
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <Doughnut data={doughnutData} options={doughnutOptions} plugins={[transparentBackgroundPlugin, centerTextPlugin]} />
                  </div>
                  <div className="flex flex-col text-azulEscuro">
                    <p className="text-2xl font-GT mb-2">Bateria da IoT</p>
                    <p className="text-sm mt-1 text-azulEscuro">
                      <span className="font-semibold">1/4</span> da bateria gasta do IoT 2
                    </p>
                    <p className="text-sm mt-1 text-azulEscuro">
                      Aprox. <span className="font-semibold text-azulEscuro">{batteryDurationHours}h</span> de duração restantes
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {mostrarCard('mapa') && (
              <div className="lg:col-span-1">
                <div className="rounded-3xl overflow-hidden shadow-sm h-full min-h-[400px]">
                  <iframe
                    title="Prévia da última rota planejada"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d117043.68415039224!2d-46.76439832793319!3d-23.55940498295627!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94ce448183a461d1%3A0x9ba94b08ff335bae!2sS%C3%A3o%20Paulo%2C%20SP!5e0!3m2!1spt-BR!2sbr!4v1727912056251!5m2!1spt-BR!2sbr"
                    className="w-full h-full"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                  ></iframe>
                </div>
              </div>
            )}

            {nenhumResultado && (
              <div className="lg:col-span-3 text-center py-16 text-gray-500">
                <p className="text-lg">Nenhum resultado encontrado para "{pesquisa}"</p>
                <p className="text-sm mt-2">Tente buscar por "mapa", "bateria", "alertas", etc.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;