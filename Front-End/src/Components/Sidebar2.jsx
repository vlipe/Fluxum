import { Link as RouterLink, useLocation } from "react-router-dom";
import { useState } from "react";
import Link from "@mui/material/Link";
import Logo from "../assets/logo.svg";
import Foto from "../assets/assetsLogin/usuario.png";

import Caixa from "../assets/assetsDashboard/caixa.svg";
import Caixa2 from "../assets/assetsDashboard/caixa2.svg";

import Grafico from "../assets/assetsDashboard/grafico.svg";
import Grafico2 from "../assets/assetsDashboard/grafico2.svg";

import Mapa from "../assets/assetsDashboard/mapa.svg";
import Mapa2 from "../assets/assetsDashboard/mapa2.svg";

import Alerta from "../assets/assetsDashboard/alerta.svg";
import Alerta2 from "../assets/assetsDashboard/alerta2.svg";

import Navio2 from "../assets/assetsDashboard/navio.svg";
import Navio from "../assets/assetsDashboard/navio2.svg";

import Home from "../assets/assetsDashboard/home.svg";

const Sidebar2 = () => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  const [hovered, setHovered] = useState({
    dashboard: false,
    relatorios: false,
    mapa: false,
    alertas: false,
    navio: false,
  });

  return (
    <div className="bg-white w-2/12 rounded-[35px] flex flex-col justify-between my-6 mb-12 ml-4 sm:mb-12 sm:w-24">
      <div className="w-full mt-2 flex flex-col gap-y-4 items-center">
        <img src={Logo} alt="Logo" className="mt-4 mb-4 w-16" />

        <Link
          to="/Dashboard"
          component={RouterLink}
          underline="none"
          onMouseEnter={() => setHovered({ ...hovered, dashboard: true })}
          onMouseLeave={() => setHovered({ ...hovered, dashboard: false })}
          className={`py-3 flex w-16 mx-auto rounded-[18px] sm:max-w-14 sm:max-h-14 ${
            isActive("/Dashboard")
              ? "bg-violeta cursor-default"
              : "hover:bg-violeta/70 cursor-pointer duration-300"
          }`}
        >
          <img
            src={isActive("/Dashboard") || hovered.dashboard ? Caixa2 : Caixa}
            className="mx-auto"
            alt="Dashboard"
          />
        </Link>

        <Link
          to="/Relatorios"
          component={RouterLink}
          underline="none"
          onMouseEnter={() => setHovered({ ...hovered, relatorios: true })}
          onMouseLeave={() => setHovered({ ...hovered, relatorios: false })}
          className={`py-3 flex w-16 mx-auto rounded-[18px] sm:max-w-14 sm:max-h-14 ${
            isActive("/Relatorios")
              ? "bg-violeta cursor-default"
              : "hover:bg-violeta/70 cursor-pointer duration-700"
          }`}
        >
          <img
            src={isActive("/Relatorios") || hovered.relatorios ? Grafico2 : Grafico}
            className="mx-auto"
            alt="Relatórios"
          />
        </Link>

        <Link
          to="/Mapa"
          component={RouterLink}
          underline="none"
          onMouseEnter={() => setHovered({ ...hovered, mapa: true })}
          onMouseLeave={() => setHovered({ ...hovered, mapa: false })}
          className={`py-3 flex w-16 mx-auto rounded-[18px] sm:max-w-14 sm:max-h-14 ${
            isActive("/Mapa")
              ? "bg-violeta cursor-default"
              : "hover:bg-violeta/70 cursor-pointer duration-700"
          }`}
        >
          <img
            src={isActive("/Mapa") || hovered.mapa ? Mapa2 : Mapa}
            className="mx-auto"
            alt="Mapa"
          />
        </Link>

        <Link
          to="/Alertas"
          component={RouterLink}
          underline="none"
          onMouseEnter={() => setHovered({ ...hovered, alertas: true })}
          onMouseLeave={() => setHovered({ ...hovered, alertas: false })}
          className={`py-3 flex w-16 mx-auto rounded-[18px] sm:max-w-14 sm:max-h-14 ${
            isActive("/Alertas")
              ? "bg-violeta cursor-default"
              : "hover:bg-violeta/70 cursor-pointer duration-700"
          }`}
        >
          <img
            src={isActive("/Alertas") || hovered.alertas ? Alerta : Alerta2}
            className="mx-auto"
            alt="Alertas"
          />
        </Link>

        <Link
          to="/Navios"
          component={RouterLink}
          underline="none"
          onMouseEnter={() => setHovered({ ...hovered, navio: true })}
          onMouseLeave={() => setHovered({ ...hovered, navio: false })}
          className={`py-3 flex w-16 mx-auto rounded-[18px] sm:max-w-14 sm:max-h-14 ${
            isActive("/Navios")
              ? "bg-violeta cursor-default"
              : "hover:bg-violeta/70 cursor-pointer duration-700"
          }`}
        >
          <img
            src={isActive("/Navios") || hovered.navio ? Navio : Navio2}
            className="mx-auto"
            alt="Navios"
          />
        </Link>
      </div>

      <div className="w-full flex flex-col items-center gap-4 mb-6">
        <Link
          to="/Home"
          component={RouterLink}
          underline="none"
          className={`py-8 flex w-16 mx-auto rounded-[18px] sm:max-w-8 ${
            isActive("/Home")
              ? "bg-violeta cursor-default"
              : "cursor-pointer"
          }`}
        >
          <img src={Home} className="mx-auto" alt="Home" />
        </Link>

        <Link
          to="/Perfil"
          component={RouterLink}
          underline="none"
        >
          <img
            src={Foto}
            alt="Foto de Perfil"
            className="w-12 h-12 rounded-full object-cover"
          />
        </Link>
      </div>
    </div>
  );
};

export default Sidebar2;
