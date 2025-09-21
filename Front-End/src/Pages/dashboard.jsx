import Sidebar from "../Components/Sidebar";
import Sidebar2 from "../Components/Sidebar2";
import SearchIcon from "@mui/icons-material/Search";
import LigarIot from "../assets/assetsDashboard/LigarIot.svg";
import Termometro from "../assets/assetsDashboard/Frame 14.svg";
import Megafone from "../assets/assetsDashboard/Frame 15.svg";
import Caminhao from "../assets/assetsDashboard/Frame 16.svg";

import React from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Registra os componentes necessários
ChartJS.register(ArcElement, Tooltip, Legend);

// Plugin para tornar o fundo do gráfico transparente
const transparentBackgroundPlugin = {
  id: "customCanvasBackgroundColor",
  beforeDraw: (chart) => {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "rgba(0,0,0,0)"; // Cor transparente
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  },
};

// Plugin para desenhar o texto no centro do gráfico
const centerTextPlugin = {
  id: "centerText",
  beforeDraw: (chart) => {
    const { width, height, ctx } = chart;
    ctx.save();

    const occupiedData = chart.config.data.datasets[0].data[0];
    const totalData = chart.config.data.datasets[0].data.reduce(
      (a, b) => a + b,
      0
    );
    const percentage = ((occupiedData / totalData) * 100).toFixed(0);

    const text = `${percentage}%`;

    // Calcula a posição central do gráfico
    const centerX = width / 2;
    const centerY = height / 2;

    // Define a fonte e alinha o texto ao centro
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Desenha a porcentagem
    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#3E41C0";
    ctx.fillText(text, centerX, centerY);

    ctx.restore();
  },
};

const data = {
  labels: ["Bateria disponível", "Bateria consumida"],
  datasets: [
    {
      label: "%",
      data: [75, 25], // Dois dados para o gráfico de rosquinha
      backgroundColor: ["#3E41C0", "#FFFFFF"], 
      borderColor: ["#FFFFFF"],
      borderWidth: 0,
    },
  ],
};

const options = {
  responsive: true,
  cutout: "70%", // Define o tamanho do centro do anel
  plugins: {
    legend: {
      display: false, // Remove a legenda
    },
    tooltip: {
      enabled: true, // Habilita o tooltip ao passar o mouse
    },
  },
};

const Dashboard = () => {
  return (
    <div className="flex min-w-full min-h-screen bg-deletar justify-between">
      <Sidebar2 />
      <div className=" w-9/12">
        <div className="w-full bag-yellow-200 mt-6 flex justify-center items-center">
          <div className="text-lg">Oi, Felipe!</div>

          <input
            type="text"
            placeholder="Pesquisar"
            className="w-7/12 h-10 rounded-3xl bg-white ml-4 relative pl-4 hover:border-2 hover:border-violeta"
          />
        </div>

        <div className="w-[96%] bg-white mt-8 rounded-xl flex flex-col px-4 pb-10 mb-8 h-5/6">
          <div className="mt-4 text-xl font-semibold text-indigo-900">
            Dashboard
          </div>
          <div className="flex flex-col w-full justify-between bg-ared-300 mt-8 gap-y-3">
            <div className="w-full mx-auto bg-indigo-100 rounded-3xl h-20 flex justify-between items-center px-6">
              <div className="text-violeta text-4xl font-bold ml-2">157</div>
              <div className="text-lg font-medium text-slate-900">
                Containers
              </div>
            </div>
            <div className="bg-indigo-100 w-full h-20 rounded-3xl flex px-6 items-center justify-between">
              <img
                src={LigarIot}
                alt="Bootão para Ligar Iot"
                className="w-14 my-auto"
              />
              <div className="text-lg font-medium text-slate-900">
                Conectar Iot
              </div>
            </div>
            <div className="bg-indigo-100 w-full h-72 rounded-3xl flex px-1 flex-col mt-3">
              <div className="flex w-full h-1/3 justify-between items-center px-2">
                <img
                  src={Termometro}
                  className="w-14"
                  alt="Termometro referente a temperatua de containers"
                />
                <div className="text-sm text-violeta font-medium">
                  Temperatura elevada
                </div>
              </div>
              <div className="flex w-full h-1/3 justify-between items-center px-2">
                <img src={Megafone} className="w-14" alt="Alerta" />
                <div className="text-sm text-violeta font-medium">
                  Rota desviada
                </div>
              </div>
              <div className="flex w-full h-1/3 justify-between items-center px-2">
                <img src={Caminhao} className="w-14" alt="Alerta rota" />
                <div className="text-sm text-violeta font-medium">
                  Rota concluída
                </div>
              </div>
            </div>
            <div className="bg-indigo-100 w-full h-28 rounded-3xl py-4 pl-4 mt-4 flex justify-between
            sm:h-28">
              <div className="h-20">
              {""}
              <Doughnut
                data={data}
                options={options}
                plugins={[transparentBackgroundPlugin, centerTextPlugin]}
              />
              </div>
              <div className="flex w-7/12 text-azulEscuro flex-col my-auto">
                <div className="text-lg font-semibold">Bateria da Iot</div>
                <div className="text-xs mt-1 text-gray-600/70">
                  Duração aproximada{" "}
                  <span className="font-semibold text-slate-950 text-sm">{"28h"}</span>
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
