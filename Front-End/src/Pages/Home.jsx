import { useState, useEffect } from "react";
import Fluxum from "../assets/fluxum.svg";
import Relogio from "../assets/clock-3 1.svg";
import DashBoard from "../assets/box 1 (1).svg";
import Logo from "../assets/logo.svg";
import Mapa from "../assets/map 1.svg";
import Home from "../assets/house 1.svg";
import Aletrtas from "../assets/flag 1.svg";
import Relatorio from "../assets/chart-pie 1.svg";
import Celular from "../assets/CelularH.svg";
import NotRisco from "../assets/NotRisco.svg";
import F6 from "../assets/Frame 6.svg";
import F7 from "../assets/Frame 7.svg";
import F8 from "../assets/Frame 8.svg";
import F9 from "../assets/Frame 9.svg";
import F10 from "../assets/Frame 10.svg";
import F11 from "../assets/Frame 11.svg";
import F12 from "../assets/Frame 12.svg";
import F13 from "../assets/Frame 13.svg";

import { Link } from "react-router-dom";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";

/* import all the icons in Free Solid, Free Regular, and Brands styles */
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";

library.add(fas, far, fab);

// Ícones simples para o botão de abrir e fechar
const MenuIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 6h16M4 12h16M4 18h16"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const App = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  // Efeito para adicionar ou remover a classe de rolagem do body
  useEffect(() => {
    if (menuOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [menuOpen]);

  return (
    //Começo do ódigo da Home//

    <div className="relative min-w-full min-h-full overflow-hidden">
      {/* Container principal da Nav-bar para desktop */}

      {/* logo e botão para abrir a sidebar mobile */}
      <div className="w-full bg-white md:hidden h-20 flex justify-between items-center">
        <div className="md:hidden ml-4">
          <button onClick={handleMenuToggle} className="p-2 text-indigo-500">
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        <img className="mr-6" src={Logo} alt="Logo" />
      </div>

      {/*começo do código para a navbar desktop */}

      <div
        className="bg-white hidden md:flex w-full h-24 m-auto mt-14 justify-around rounded-2xl py-4 px-6
      md:w-full md:mx-0 md:justify-between md:text-sm
      2xl:w-5/6 2xl:mx-auto"
      >
        <div className="flex bg-white  md:w-8/12 justify-around">
          <img src={Logo} alt="" className="m-0" />

          <div
            className="bg-slate-100 flex rounded-full w-5/6 h-16
        md:overflow-x-hidden"
          >
            <div className="w-1/6  rounded-full flex justify-center items-center bg-indigo-500 text-white shadow-[5px_0_10px_0_rgba(91,97,179,0.4)] lg:text-lg">
              Início
            </div>
            <div className=" hover:text-indigo-300 transition-all duration-500 font-medium text-indigo-500 flex justify-center items-center mx-2 text-base lg:text-lg lg:mx-5 xl:mx-8 xl:text-xl">
              Dashboard
            </div>
            <div className="hover:text-indigo-300 transition-all duration-500 font-medium text-indigo-500 flex justify-center items-center mx-2 text-base lg:text-lg lg:mx-5 xl:mx-8 xl:text-xl">
              Alertas
            </div>
            <div className="hover:text-indigo-300 transition-all duration-500 font-medium text-indigo-500 flex justify-center items-center mx-2 text-base lg:text-lg lg:mx-5 xl:mx-8 xl:text-xl">
              Mapas
            </div>
            <div className="hover:text-indigo-300 transition-all duration-500 font-medium text-indigo-500 flex justify-center items-center mx-2 text-base lg:text-lg lg:mx-5 xl:mx-8 xl:text-xl">
              Relatórios
            </div>
          </div>
        </div>
        <div className="bg-white w-3/12 flex h-[54px] justify-between my-auto xl:w-4/12 2xl:w-3/12">
          <div
            className="hover:text-indigo-300 transition-all duration-500 w-6/12 h-[54px] font-medium text-xs flex justify-center items-center
           text-indigo-700 bg-white lg:mr-2 lg:text-lg xl:text-xl 2xl:mr-4"
          >
            Cadastre-se
          </div>

          <div
            className="hover:text-indigo-500 transition-all duration-500 hover:bg-white hover:border-2 hover:border-indigo-500
           border-indigo-500 border-2 bg-indigo-500 w-6/12 h-[54px] font-medium flex justify-center items-center text-white rounded-2xl lg:text-lg xl:text-xl"
          >
            Login
          </div>
        </div>
      </div>
      {/* Final do código da navbar desktop */}

      {/* começo do código referente a sidebar mobile aberta */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-300"
          onClick={handleMenuToggle}
        ></div>
      )}

      {/* Menu para mobile que desliza da esquerda */}
      <div
        className={`
          md:hidden fixed top-0 left-0 h-svh overflow-y-auto w-7/12 bg-purple-50 text-white rounded-e-3xl z-50
          transform transition-transform duration-300 ease-in-out
          ${menuOpen ? "translate-x-0 " : "-translate-x-full "}
          ${
            menuOpen
              ? "shadow-[0_-5px_20px_0_rgba(0,0,0,0.1),_5px_0_10px_0_rgba(0,0,0,0.1),_0_5px_20px_0_rgba(91,97,179,0.1)]"
              : ""
          }
        `}
      >
        <div className="flex w-5/6 mx-auto justify-center py-6 mt-4 bg-purple-50 border-b-2 border-indigo-400">
          <div className=" text-2xl text-indigo-500 font-bold flex items-center justify-center">
            <img src={Logo} alt="" />
          </div>
        </div>

        <div className="flex flex-col gap-y-6 mt-10 items-start ">
          <a
            href="#"
            className=" bg-indigo-500 py-2 rounded-e-lg flex w-5/6 font-normal text-lg text-white items-center relative"
          >
            <img src={Home} className="w-1/6 ml-3 mr-4 text-white" alt="" />
            Início
          </a>
          <a
            href="#"
            className="bg-purple-50 py-2 rounded-e-lg flex w-5/6 text-indigo-500 font-normal text-lg items-center hover:bg-indigo-200 hover:text-white transition-all duration-500"
          >
            <img src={DashBoard} className="w-1/6 mr-4 ml-3" alt="" />
            Dashboard
          </a>
          <a
            href="#"
            className="bg-purple-50 py-2 rounded-e-lg flex w-5/6 text-lg text-indigo-500 font-normal items-center hover:bg-indigo-200 hover:text-white transition-all duration-500"
          >
            <img src={Aletrtas} className="w-1/6 mr-4 ml-3" alt="" />
            Alertas
          </a>
          <a
            href="#"
            className="bg-purple-50 py-2 rounded-e-lg flex w-5/6 text-indigo-500 font-normal text-lg items-center hover:bg-indigo-200 hover:text-white transition-all duration-500"
          >
            <img src={Mapa} className="w-1/6 mr-4 ml-3" alt="" />
            Mapas
          </a>
          <a
            href="#"
            className="bg-purple-50 py-2 rounded-e-lg flex w-5/6 text-indigo-500 font-normal items-center text-lg hover:bg-indigo-200 hover:text-white transition-all duration-500"
          >
            <img src={Relatorio} className="w-1/6 mr-4 ml-3" alt="" />
            Relatórios
          </a>
        </div>
        <div className="bg-indigo-500 w-5/6 mx-auto h-12 mt-10 items-center absolute bottom-24 flex justify-center rounded-xl text-xl left-1/2 -translate-x-1/2 border-2 font-semibold hover:bg-purple-50 hover:text-indigo-500 hover:border-indigo-500 transition-all duration-700">
          Login
        </div>
        <div className="bg-purple-50 w-5/6 mx-auto h-12 mt-6 items-center bottom-8 absolute flex justify-center left-1/2 -translate-x-1/2 text-indigo-500 rounded-xl text-xl font-semibold border-2 border-purple-50 hover:border-indigo-500 transition-all duration-700">
          Cadastrar-se
        </div>
      </div>

      {/* final do código referente a sidebar mobile aberta */}

      {/* começo do código para o primeiro container da home */}

      <div className="h-[672px] w-full flex flex-col sm:h-[800px] md:h-[840px] md:mt-20 lg:h-[1180px]">
        {/* código referente ao conteiner superior  */}
        <div
          className="w-11/12 h-1/2 bg-purple-50 border-stone-100 rounded-2xl mx-auto flex flex-col shadow-[0px_0px_10px_6px_rgba(25,27,64,0.1)]
        sm:min-h-96
        md:min-h-[420px]
        lg:min-h-[680px]
        2xl:min-h-[800px]"
        >
          <div
            className="w-5/12 h-8 bg-white text-sm flex justify-center items-center rounded-md text-indigo-500 mx-auto mt-12 shadow-[0px_0px_5px_4px_rgba(25,27,64,0.1)]
          sm:w-4/12 sm:h-9
          md:w-3/12
          lg:w-2/12 lg:mt-24
          xl:h-10 xl:text-base
          2xl:text-lg"
          >
            Controle o Fluxo
          </div>
          <div
            className="w-11/12 h-22 text-lg justify-center items-center text-center font-bold mx-auto mt-8 text-slate-700
          sm:text-2xl
          md:text-3xl
          lg:px-24 lg:text-4xl lg:mt-20
          xl:text-5xl
          2xl:px-48 2xl:text-6xl"
          >
            Explore Dados em Fluxo e Monitore o Essencial em Tempo Real.
          </div>
          <div
            className="w-11/12 h-22 text-xs justify-center items-center text-center font-base mx-auto mt-3 text-slate-950
          sm:text-sm
          md:text-base md:mt-8
          lg:text-xl lg:px-48 lg:mt-6
          2xl:text-2xl 2xl:px-64"
          >
            Visualize, analise e tome decisões com base em dados reais,
            utilizando o sistema inteligente, Fluxum.
          </div>
          <div
            className="flex justify-between w-4/6 mx-auto mt-8
          md:w-1/2
          lg:mt-20
          2xl:mt-28 2xl:w-2/6"
          >
            <div
              className="w-5/12 h-8 bg-indigo-500 text-white flex justify-center items-center rounded-lg
            sm:h-9
            lg:h-10
            xl:w-4/12
            2xl:text-lg"
            >
              Iniciar
            </div>
            <div
              className="w-5/12 h-8 bg-white flex justify-center items-center rounded-lg text-indigo-500 shadow-[0px_0px_5px_4px_rgba(25,27,64,0.1)]
            sm:h-9
            lg:h-10
            xl:w-4/12
            2xl:text-lg"
            >
              Explorar
            </div>
          </div>
        </div>

        {/* código referente ao container inferior */}
        <div
          className="w-11/12 h-7/12 z-80 bg-indigo-500 rounded-2xl mx-auto flex justify-between border-4 border-indigo-500 -mt-6 md:min-h-[440px]
        lg:min-h-[500px]
        2xl:min-h-[600px]"
        >
          <div
            className="flex flex-col w-3/6 min-h-full justify-between
          2xl:w-3/6"
          >
            <div
              className="flex flex-col mt-10 ml-2
             sm:my-auto sm:h-5/6
             lg:ml-8 lg:justify-center"
            >
              <div
                className="text-xs font-light text-white
              sm:text-sm
              md:text-base
              lg:text-lg
              2xl:text-xl"
              >
                O que é o Fluxum?
              </div>
              <div
                className="text-sm mt-2 font-bold text-white
              sm:text-base
              md:text-xl md:mr-8
              lg:text-2xl lg:mt-6
              2xl:text-3xl"
              >
                O Sistema Inteligente de Monitoramento Portuário com IoT e
                Computação em Nuvem
              </div>
              <div
                className="hidden sm:flex text-xs font-light text-white mt-8
              md:text-sm
              lg:pr-6
              2xl:text-base"
              >
                Fluxum é uma plataforma inteligente de monitoramento portuário,
                desenvolvida para rastrear cointâineres em tempo real, emitir
                alertas automáticos e transformar dados brutos em decisões
                estratégicas.
              </div>
              <div
                className="hidden sm:flex text-xs font-light text-white mt-3
              md:text-sm
              lg:pr-6
              2xl:text-base"
              >
                Integrando sensores IoT e computação em nuvem, o sistema oferece
                uma visão clara, precisa e atualizada da logística no ambiente
                portuário - tudo em um único dashboard.
              </div>
              <div
                className="hidden sm:flex text-xs font-light text-white mt-3
              md:text-sm
              lg:pr-6
              2xl:text-base"
              >
                Com o Fluxum, portos se tornam mais eficientes, seguros e
                conectados.
              </div>
            </div>
            <img src={NotRisco} className="ml-2 mb-0.3 sm:hidden" alt="" />
          </div>
          <div
            className="flex my-auto w-5/12 mr-2 h-full md:h-5/6 md-lg:h-full md:-rotate-[25deg] 
          xl:ml-0 xl:mr-0
          2xl:mr-16 2xl:-mat-6"
          >
            <img
              src={Celular}
              alt=""
              className="w-full rounded-[25px] mx-auto my-auto md:w-auto  md:h-full shadow-black/55 shadow-2xl z-30"
            />
            <div
              className="flex flex-col justify-start h-1/2 bga-red-600 md:h-[170px]
            lg:h-72"
            >
              <img
                src={NotRisco}
                className="hidden rounded-md md:flex md:w-auto md:h-auto md:min-w-40 md:mt-1 md:ml-2 md-lg:min-w-44 shadow-black/70 shadow-2xl"
                alt=""
              />
              <img
                src={F6}
                alt=""
                className="hidden rounded-lg md:flex w-full mx-auto md:w-auto md:h-auto md:mt-4 md:ml-2 shadow-black/70 shadow-2xl
                lg:"
              />
              <img
                src={F8}
                alt=""
                className="hidden rounded-xl lg:flex mx-auto h-1/6 ml-2 shadow-black/70 shadow-2xl mt-4
                xl:hidden"
              />
              <img
                src={F9}
                alt=""
                className="hidden xl:flex w-11/12 rounded-[20px] mt-6 ml-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* começo do código referente as caixas de informações */}

          <div className="w-11/12 bga-red-900 flex flex-col mx-auto -mt-8 mb-96">
          
          <div className="w-88 h-60 flex bg-white rounded-xl mx-auto flex-col">
            <img src={F11} alt="" className="w-2/12 mt-4 ml-6"/>
            <div className="text-2xl font-bold text-slate-700 mt-3 ml-6">Fluxo Monitorado</div>
            <div className="mt-2 ml-6 text-base text-slate-700 pr-4">Visualize, analise e tome desições com base em dados reais.</div>
          </div>

          <div className="w-88 h-60 flex bg-white rounded-xl mx-auto flex-col shadow-[0px_0px_20px_6px_rgba(25,27,64,0.15)] z-20">
            <img src={F12} alt="" className="w-2/12 mt-4 ml-6"/>
            <div className="text-2xl font-bold text-slate-700 mt-3 ml-6">Decições Rápidas</div>
            <div className="mt-2 ml-6 text-base text-slate-700 pr-4">Visualize, analise e tome decisões com base em dados reais, utilizando o sistema inteligente, Fluxum.</div>
          </div>

          <div className="w-88 h-60 flex bg-white rounded-xl mx-auto flex-col mt-4">
            <img src={F13} alt="" className="w-2/12 mt-4 ml-6"/>
            <div className="text-2xl font-bold text-slate-700 mt-3 ml-6">Detecte Riscos</div>
            <div className="mt-2 ml-6 text-base text-slate-700 pr-4">Receba notificações automáticas sobre movimentações incomuns, atrasos ou situações críticas no fluxo portuário.</div>
          </div>

          </div>

    </div>
  );
};

export default App;
