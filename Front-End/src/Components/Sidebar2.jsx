import { Link as RouterLink, useLocation } from "react-router-dom";
import Link from "@mui/material/Link";
import Logo from "../assets/logo.svg";
import Foto from "../assets/assetsLogin/usuario.png";

import { useState, useEffect } from "react";

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

import FotoDefault from "../assets/assetsLogin/usuario.png";  
import { apiFetch } from "../lib/api"; 

import Home from "../assets/assetsDashboard/home.svg";

const API = import.meta.env.VITE_API_URL || "";
const toAbsolute = (u) => (!u ? u : (u.startsWith("http") ? u : API.replace(/\/$/, "") + u));

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

  const [avatar, setAvatar] = useState(FotoDefault);
  
  useEffect(() => {
    let live = true;

    apiFetch("/api/users/me", { auth: true })
      .then((me) => {
        if (!live) return;
        setAvatar(me?.avatar_url ? toAbsolute(me.avatar_url) : FotoDefault);
      })
      .catch(() => {});

    const onUpd = (e) => {
      const url = e.detail?.url;
      setAvatar(url ? toAbsolute(url) : FotoDefault);
    };
    window.addEventListener("avatar:updated", onUpd);

    return () => {
      live = false;
      window.removeEventListener("avatar:updated", onUpd);
    };
  }, []);

  return (
    <div
      className="
        bg-white rounded-[35px] flex justify-between
        my-6 ml-4 mb-12
        w-1/12 max-h-screen flex-col
        max-[760px]:fixed max-[760px]:top-0 max-[760px]:left-0 max-[760px]:right-0 
        max-[760px]:w-full max-[760px]:h-16 max-[760px]:flex-row 
        max-[760px]:items-center max-[760px]:px-4 max-[760px]:z-50 
        max-[760px]:rounded-none max-[760px]:my-0 max-[760px]:ml-0 max-[760px]:mb-0
      "
    >

      <div
        className="
          w-full flex flex-col gap-y-4 items-center
          mt-2
          max-[760px]:flex-row max-[760px]:justify-start max-[760px]:gap-x-4 
          max-[760px]:mt-0 max-[760px]:w-auto
        "
      >
        <img 
          src={Logo} 
          alt="Logo" 
          className="mt-4 mb-4 w-16 max-[760px]:mt-0 max-[760px]:mb-0 max-[760px]:w-8 max-[760px]:mr-2" 
        />

        <div
          className="
            flex flex-col gap-y-4 items-center w-full
            max-[760px]:flex-row max-[760px]:justify-center max-[760px]:gap-x-3
            max-[760px]:w-auto max-[760px]:flex-1
          "
        >
          <Link
            to="/Dashboard"
            component={RouterLink}
            underline="none"
            onMouseEnter={() => setHovered({ ...hovered, dashboard: true })}
            onMouseLeave={() => setHovered({ ...hovered, dashboard: false })}
            className={`
              py-3 flex w-16 mx-auto rounded-[18px] justify-center items-center
              max-[760px]:w-10 max-[760px]:h-10 max-[760px]:rounded-[10px] max-[760px]:py-2
              ${isActive("/Dashboard")
                ? "bg-violeta cursor-default"
                : "hover:bg-violeta/70 cursor-pointer duration-300"
              }
            `}
          >
            <img
              src={isActive("/Dashboard") || hovered.dashboard ? Caixa2 : Caixa}
              className="mx-auto max-[760px]:w-5 max-[760px]:h-5"
              alt="Dashboard"
            />
          </Link>

          <Link
            to="/Relatorios"
            component={RouterLink}
            underline="none"
            onMouseEnter={() => setHovered({ ...hovered, relatorios: true })}
            onMouseLeave={() => setHovered({ ...hovered, relatorios: false })}
            className={`
              py-3 flex w-16 mx-auto rounded-[18px] justify-center items-center
              max-[760px]:w-10 max-[760px]:h-10 max-[760px]:rounded-[10px] max-[760px]:py-2
              ${isActive("/Relatorios")
                ? "bg-violeta cursor-default"
                : "hover:bg-violeta/70 cursor-pointer duration-300"
              }
            `}
          >
            <img
              src={isActive("/Relatorios") || hovered.relatorios ? Grafico2 : Grafico}
              className="mx-auto max-[760px]:w-5 max-[760px]:h-5"
              alt="Relatórios"
            />
          </Link>

          <Link
            to="/Mapa"
            component={RouterLink}
            underline="none"
            onMouseEnter={() => setHovered({ ...hovered, mapa: true })}
            onMouseLeave={() => setHovered({ ...hovered, mapa: false })}
            className={`
              py-3 flex w-16 mx-auto rounded-[18px] justify-center items-center
              max-[760px]:w-10 max-[760px]:h-10 max-[760px]:rounded-[10px] max-[760px]:py-2
              ${isActive("/Mapa")
                ? "bg-violeta cursor-default"
                : "hover:bg-violeta/70 cursor-pointer duration-300"
              }
            `}
          >
            <img
              src={isActive("/Mapa") || hovered.mapa ? Mapa2 : Mapa}
              className="mx-auto max-[760px]:w-5 max-[760px]:h-5"
              alt="Mapa"
            />
          </Link>

          <Link
            to="/Alertas"
            component={RouterLink}
            underline="none"
            onMouseEnter={() => setHovered({ ...hovered, alertas: true })}
            onMouseLeave={() => setHovered({ ...hovered, alertas: false })}
            className={`
              py-3 flex w-16 mx-auto rounded-[18px] justify-center items-center
              max-[760px]:w-10 max-[760px]:h-10 max-[760px]:rounded-[10px] max-[760px]:py-2
              ${isActive("/Alertas")
                ? "bg-violeta cursor-default"
                : "hover:bg-violeta/70 cursor-pointer duration-300"
              }
            `}
          >
            <img
              src={isActive("/Alertas") || hovered.alertas ? Alerta : Alerta2}
              className="mx-auto max-[760px]:w-5 max-[760px]:h-5"
              alt="Alertas"
            />
          </Link>

          <Link
            to="/Navios"
            component={RouterLink}
            underline="none"
            onMouseEnter={() => setHovered({ ...hovered, navio: true })}
            onMouseLeave={() => setHovered({ ...hovered, navio: false })}
            className={`
              py-3 flex w-16 mx-auto rounded-[18px] justify-center items-center
              max-[760px]:w-10 max-[760px]:h-10 max-[760px]:rounded-[10px] max-[760px]:py-2
              ${isActive("/Navios")
                ? "bg-violeta cursor-default"
                : "hover:bg-violeta/70 cursor-pointer duration-300"
              }
            `}
          >
            <img
              src={isActive("/Navios") || hovered.navio ? Navio : Navio2}
              className="mx-auto max-[760px]:w-5 max-[760px]:h-5"
              alt="Navios"
            />
          </Link>
        </div>
      </div>

      <div
        className="
          w-full flex flex-col items-center gap-4 mb-6
          max-[760px]:flex-row max-[760px]:mb-0 max-[760px]:gap-x-3 
          max-[760px]:justify-end max-[760px]:w-auto
        "
      >
        <Link
          to="/Home"
          component={RouterLink}
          underline="none"
          className={`
            py-8 flex w-16 mx-auto rounded-[18px] justify-center items-center
            max-[760px]:w-10 max-[760px]:h-10 max-[760px]:rounded-[10px] max-[760px]:py-2
            ${isActive("/Home") ? "bg-violeta cursor-default" : "cursor-pointer"}
          `}
        >
          <img 
            src={Home} 
            className="mx-auto max-[760px]:w-5 max-[760px]:h-5" 
            alt="Home" 
          />
        </Link>

        <Link to="/Perfil" component={RouterLink} underline="none">
          <img
            src={avatar}
            alt="Foto de Perfil"
            className="w-11 h-11 rounded-full object-cover max-[760px]:w-8 max-[760px]:h-8"
          />
        </Link>
      </div>
    </div>
  );
};

export default Sidebar2;