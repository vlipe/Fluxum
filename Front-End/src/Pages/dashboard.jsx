import React, { useEffect, useMemo, useState } from "react";
import Sidebar2 from "../Components/Sidebar2";
import LigarIot from "../assets/assetsDashboard/LigarIot.svg";
import Termometro from "../assets/assetsDashboard/Frame 14.svg";
import Megafone from "../assets/assetsDashboard/Frame 15.svg";
import Caminhao from "../assets/assetsDashboard/Frame 16.svg";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { apiFetch } from "../lib/api";
import ConnectionBadge from "../Components/ConnectionBadge";

ChartJS.register(ArcElement, Tooltip, Legend);

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
    ctx.font = "18px sans-serif";
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
    if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
    return `${Math.floor(diff / 86400)}d atrás`;
  } catch {
    return "—";
  }
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    containersCount: 0,
    cards: [],
    battery: { percent: null },
    temperature: { celsius: null }
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
          battery: { percent: null },
          temperature: { celsius: null }
        });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const containersCount = summary?.containersCount ?? 0;
  const card1 = summary?.cards?.[0] || { label: "Temperatura elevada", ts_iso: null };
  const card2 = summary?.cards?.[1] || { label: "Rota desviada", ts_iso: null };
  const card3 = summary?.cards?.[2] || { label: "Rota concluída", ts_iso: null };

  const iconFor = (label) => {
    if (label === "Temperatura elevada") return Termometro;
    if (label === "Rota desviada") return Megafone;
    if (label === "Rota concluída") return Caminhao;
    return Caminhao;
  };

  const batteryPercent = Number.isFinite(+summary?.battery?.percent) ? Math.max(0, Math.min(100, +summary.battery.percent)) : 75;

  const data = useMemo(() => ({
    labels: ["Bateria disponível", "Bateria consumida"],
    datasets: [
      {
        label: "%",
        data: [batteryPercent, 100 - batteryPercent],
        backgroundColor: ["#3E41C0", "#FFFFFF"],
        borderColor: ["#FFFFFF"],
        borderWidth: 0
      }
    ]
  }), [batteryPercent]);

  const options = {
    responsive: true,
    cutout: "70%",
    plugins: { legend: { display: false }, tooltip: { enabled: true } }
  };

  return (
    <div className="flex min-w-full min-h-screen bg-deletar justify-between">
      <Sidebar2 />
      <div className=" w-9/12">
        <div className="w-full mt-6 flex justify-center items-center gap-4">
          <div className="text-lg sm:text-xl">Oi, Felipe!</div>
          <ConnectionBadge />
          <input type="text" placeholder="Pesquisar" className="w-7/12 h-10 rounded-3xl bg-white ml-4 relative pl-4 sm:h-12" />
        </div>

        <div className="w-[96%] bg-white mt-8 rounded-xl flex flex-col px-4 pb-10 mb-8 h-5/6">
          <div className="mt-4 text-xl font-semibold text-indigo-900 sm:text-2xl sm:ml-2">Dashboard</div>

          <div className="flex flex-col w-full justify-between mt-8 gap-y-3">
            <div className="w-full mx-auto bg-indigo-100 rounded-3xl h-20 flex justify-between items-center px-6 sm:h-24 sm:px-8">
              <div className="text-violeta text-4xl font-bold ml-2 sm:text-5xl">{loading ? "—" : containersCount}</div>
              <div className="text-lg font-medium text-slate-900 sm:text-2xl">Containers</div>
            </div>

            <div className="bg-indigo-100 w-full h-20 rounded-3xl flex px-6 items-center justify-between sm:h-24 sm:px-8">
              <img src={LigarIot} alt="Bootão para Ligar Iot" className="w-14 my-auto sm:w-20" />
              <div className="text-lg font-medium text-slate-900 sm:text-2xl">Conectar Iot</div>
            </div>

            <div className="bg-indigo-100 w-full h-72 rounded-3xl flex px-1 flex-col mt-3">
              <div className="flex w-full h-1/3 justify-between items-center px-2 sm:justify-between sm:gap-x-12">
                <img src={iconFor(card1.label)} className="w-14 sm:hidden" alt="" />
                <div className="text-sm text-violeta font-medium sm:hidden">{card1.label}</div>
                <div className="hidden sm:flex h-full items-center">
                  <img src={iconFor(card1.label)} className="w-14 " alt="" />
                  <div className="text-base text-violeta font-medium ml-3">{card1.label}</div>
                </div>
                <div className="hidden sm:flex text-violeta font-normal">{card1.ts_iso ? timeAgo(card1.ts_iso) : "—"}</div>
              </div>

              <div className="flex w-full h-1/3 justify-between items-center px-2">
                <img src={iconFor(card2.label)} className="w-14 sm:hidden" alt="" />
                <div className="text-sm text-violeta font-medium sm:hidden">{card2.label}</div>
                <div className="hidden sm:flex items-center">
                  <img src={iconFor(card2.label)} className="w-14" alt="" />
                  <div className="text-base text-violeta font-medium ml-3">{card2.label}</div>
                </div>
                <div className="hidden sm:flex text-violeta font-normal">{card2.ts_iso ? timeAgo(card2.ts_iso) : "—"}</div>
              </div>

              <div className="flex w-full h-1/3 justify-between items-center px-2">
                <img src={iconFor(card3.label)} className="w-14 sm:hidden" alt="" />
                <div className="text-sm text-violeta font-medium sm:hidden">{card3.label}</div>
                <div className="hidden sm:flex justify-between items-center">
                  <img src={iconFor(card3.label)} className="w-14" alt="" />
                  <div className="text-base text-violeta font-medium ml-3">{card3.label}</div>
                </div>
                <div className="hidden sm:flex text-violeta font-normal">{card3.ts_iso ? timeAgo(card3.ts_iso) : "—"}</div>
              </div>
            </div>

            <div className="bg-indigo-100 w-full h-28 rounded-3xl py-4 pl-4 mt-4 flex justify-between sm:h-36">
              <div className="h-20 sm:h-28">
                <Doughnut data={data} options={options} plugins={[transparentBackgroundPlugin, centerTextPlugin]} />
              </div>
              <div className="flex w-7/12 text-azulEscuro flex-col my-auto">
                <div className="text-lg font-semibold sm:text-2xl">Bateria da Iot</div>
                <div className="text-xs mt-1 text-gray-600/70">
                  Duração aproximada <span className="font-semibold text-slate-950 text-sm">28h</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
