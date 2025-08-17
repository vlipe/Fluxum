import { useState, useEffect } from "react";
import Fluxum from "./assets/fluxum.svg";
import Relogio from "./assets/clock-3 1.svg";
import DashBoard from "./assets/box 1 (1).svg";
import Logo from "./assets/logo.svg";
import Mapa from "./assets/map 1.svg";
import Home from "./assets/house 1.svg";
import Aletrtas from "./assets/flag 1.svg";
import Relatorio from "./assets/chart-pie 1.svg";
import Celular from "./assets/CelularH.svg";
import NotRisco from "./assets/NotRisco.svg";

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
    document.body.classList.add('overflow-hidden');
  } else {
    document.body.classList.remove('overflow-hidden');
  }
}, [menuOpen]);

  return (
    <div className="relative min-w-full min-h-full">
      {/* Container principal da Nav-bar para desktop */}
      <div className="w-full bg-white md:hidden h-20 flex justify-between items-center">
        {/* Botão do menu para mobile, agora à esquerda */}
        <div className="md:hidden ml-4">
          <button onClick={handleMenuToggle} className="p-2 text-indigo-500">
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {/* Logo, agora à direita */}
        <img className="mr-6" src={Logo} alt="Logo" />
      </div>

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
          <div className="hover:text-indigo-300 transition-all duration-500 w-6/12 h-[54px] font-medium text-xs flex justify-center items-center text-indigo-700 bg-white lg:mr-2 lg:text-lg xl:text-xl 2xl:mr-4">
            Cadastre-se
          </div>

          <div className="hover:text-indigo-500 transition-all duration-500 hover:bg-white hover:border-2 hover:border-indigo-500 border-indigo-500 border-2 bg-indigo-500 w-6/12 h-[54px] font-medium flex justify-center items-center text-white rounded-2xl lg:text-lg xl:text-xl">
            Login
          </div>
        </div>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 transition-opacity duration-300"
          onClick={handleMenuToggle}
        ></div>
      )}

      {/* Menu para mobile que desliza da esquerda */}
      <div
        className={`
          md:hidden fixed top-0 left-0 h-svh overflow-y-auto w-7/12 bg-purple-50 text-white rounded-e-50 z-50
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
            FLUXUM
          </div>
        </div>

        <div className="flex flex-col gap-y-6 mt-10 items-center ">
          <a
            href="#"
            className=" bg-indigo-500 py-2 rounded-lg flex ml-4 w-5/6 text-medium text-white font-semibold items-center relative"
          >
            <img src={Home} className="w-1/6 ml-3 mr-4 text-white" alt="" />
            Início
          </a>
          <a
            href="#"
            className="bg-purple-50 py-3 flex ml-4 w-5/6 text-medium text-indigo-400 font-semibold items-center"
          >
            <img src={DashBoard} className="w-1/6 mr-4 ml-3" alt="" />
            Dashboard
          </a>
          <a
            href="#"
            className="bg-purple-50 py-3 flex ml-4 w-5/6 text-medium text-indigo-400 font-semibold items-center"
          >
            <img src={Aletrtas} className="w-1/6 mr-4 ml-3" alt="" />
            Alertas
          </a>
          <a
            href="#"
            className="bg-purple-50 py-3 flex ml-4 w-5/6 text-medium text-indigo-400 font-semibold items-center"
          >
            <img src={Mapa} className="w-1/6 mr-4 ml-3" alt="" />
            Mapas
          </a>
          <a
            href="#"
            className="bg-purple-50 py-3 flex ml-4 w-5/6 text-medium text-indigo-400 font-semibold items-center"
          >
            <img src={Relatorio} className="w-1/6 mr-4 ml-3" alt="" />
            Relatórios
          </a>
        </div>
        <div className="bg-indigo-500 w-5/6 mx-auto h-12 mt-10 items-center absolute bottom-24 flex justify-center rounded-md text-xl left-1/2 -translate-x-1/2 font-semibold">
          Login
        </div>
        <div className="bg-purple-50 w-5/6 mx-auto h-10 mt-6 items-center bottom-8 absolute flex justify-center left-1/2 -translate-x-1/2 text-indigo-500 rounded-md text-xl font-semibold">
          Cadastrar-se
        </div>
      </div>
      <div className="h-[640px] w-full flex flex-col">
        <div className="w-11/12 h-96 bg-purple-50 border-stone-100 rounded-2xl mx-auto mt-8 flex relative flex-col shadow-[0px_0px_10px_6px_rgba(25,27,64,0.1)]">
          <div className="w-5/12 h-8 bg-white text-sm flex justify-center items-center rounded-md text-indigo-500 mx-auto mt-12 shadow-[0px_0px_5px_4px_rgba(25,27,64,0.1)]">
            Controle o Fluxo
          </div>
          <div className="w-11/12 h-22 text-lg justify-center items-center text-center font-bold mx-auto mt-8 text-slate-950">
            Explore Dados em Fluxo e Monitore o Essencial em Tempo Real.
          </div>
          <div className="w-11/12 h-22 text-xs justify-center items-center text-center font-base mx-auto mt-3 text-slate-950">
            Visualize, analise e tome decisões com base em dados reais,
            utilizando o sistema inteligente, Fluxum.
          </div>
          <div className="flex justify-between w-4/6 mx-auto mt-8">
            <div className="w-5/12 h-8 bg-indigo-500 text-white flex justify-center items-center rounded-lg">
              Iniciar
            </div>
            <div className="w-5/12 h-8 bg-white flex justify-center items-center rounded-lg text-indigo-500 shadow-[0px_0px_5px_4px_rgba(25,27,64,0.1)]">
              Explorar
            </div>
          </div>
          <div className="w-full min-h-72 z-80 bg-indigo-500 rounded-2xl mx-auto mt-8 flex justify-between absolute top-72 border-4 border-indigo-500 left-1/2 -translate-x-1/2">
            <div className="flex flex-col bg-read-600 w-3/6 min-h-full justify-between">
            <div className="flex flex-col mt-10 ml-2">
              <div className="text-xs font-light text-white">
                O que é o Fluxum?
              </div>
              <div className="text-sm mt-2 font-bold text-white">
                O Sistema Inteligente de Monitoramento Portuário com IoT e
                Computação em Nuvem
              </div>
              </div>
              <img src={NotRisco} className="ml-2 mb-2" alt="" />
            </div>
            <div className="flex flex-col-reverse my-auto w-5/12 mr-2 h-full">
              <img src={Celular} alt="" className="w-full mx-auto" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
