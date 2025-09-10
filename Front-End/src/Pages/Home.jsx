import { useState, useEffect } from "react";


import Logo from "../assets/logo.svg";

import Celular from "../assets/assetsHome/CelularH.svg";
import NotRisco from "../assets/assetsHome/NotRisco.svg";
import F6 from "../assets/assetsHome/Frame 6.svg";
import F8 from "../assets/assetsHome/Frame 8.svg";
import F9 from "../assets/assetsHome/Frame 9.svg";
import F11 from "../assets/assetsHome/Frame 11.svg";
import F12 from "../assets/assetsHome/Frame 12.svg";
import F13 from "../assets/assetsHome/Frame 13.svg";
import F14 from "../assets/assetsHome/Frame 14.svg";


import FaqComponent from "../Components/FaqComponent";
import Footer from "../Components/Footer";

/* Imports referentes aos ícones, biblioteca MUI */

import HomeOutline from "@mui/icons-material/HomeOutlined";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import NotificationsActiveRoundedIcon from "@mui/icons-material/NotificationsActiveRounded";
import MapIcon from "@mui/icons-material/Map";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import Link from "@mui/material/Link";

import { Link as RouterLink } from "react-router-dom";

const faqData = [
  {
    question: "Preciso de conexão à internet?",
    answer:
      "Sim, é necessária uma conexão de internet para o funcionamento completo do sistema Fluxum, pois ele utiliza computação em nuvem para processar e armazenar dados em tempo real.",
  },
  {
    question: "Como funciona a comunicação com os sensores IoT?",
    answer:
      "A comunicação é feita via uma rede mesh de longo alcance, que envia os dados para a plataforma Fluxum, onde são processados em tempo real.",
  },
  {
    question: "Posso acessar o sistema de qualquer lugar?",
    answer:
      "Sim, o sistema é baseado na nuvem e pode ser acessado de qualquer dispositivo com uma conexão à internet, seja um celular, tablet ou computador.",
  },
  {
    question: "O sistema emite alertas para riscos?",
    answer:
      "Sim, a plataforma Fluxum monitora dados em tempo real e emite alertas automáticos em caso de anomalias ou riscos de segurança, garantindo uma resposta rápida e eficaz.",
  },
  {
    question: "O sistema é compatível com diferentes tipos de sensores?",
    answer:
      "Sim, o Fluxum é projetado para ser flexível e se integra a uma ampla variedade de sensores IoT, permitindo que você adapte a plataforma às necessidades específicas do seu porto.",
  },
];

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
      {/* nav-bar para desktop */}

      {/* sidebar mobile */}
      <div className="w-full bg-white md:hidden h-20 flex justify-between items-center">
        <div className="md:hidden ml-4">
          <button onClick={handleMenuToggle} className="p-2 text-violeta">
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        <img className="mr-6" src={Logo} alt="Logo" />
      </div>

      {/* navbar desktop */}

      <div
        className="bg-white hidden md:flex w-full h-24 m-auto mt-14 justify-around rounded-2xl py-4 px-6
      md:w-full md:mx-0 md:justify-between md:text-sm
      2xl:w-5/6 2xl:mx-auto"
      >
        <div className="flex bg-white  md:w-8/12 justify-between mr-8">
          <img src={Logo} alt="" className="m-0" />

          <div
            className="bg-bege flex rounded-full w-5/6 h-16
        md:overflow-x-hidden"
          >
            <div className="w-36 rounded-full flex justify-center items-center bg-violeta text-white shadow-[4px_0px_3px_rgba(91,97,179,0.4)] lg:text-base">
              Início
            </div>
            <Link
              to="/Dashboard"
              component={RouterLink}
              fontSize={18}
              color="indigo-500"
              underline="none"
              className="py-2 rounded-e-lg flex  text-violeta text-lg items-center"
            >
              <div className=" hover:text-indigo-300 transition-all duration-500 font-medium py-3.5 text-violeta flex justify-center items-center mx-2 text-base lg:text-base lg:mx-5 xl:mx-8 xl:text-base">
                Dashboard
              </div>
            </Link>
            <Link
              to="/Alertas"
              component={RouterLink}
              fontSize={18}
              color="indigo-500"
              underline="none"
              className="py-2 rounded-e-lg flex  text-violeta text-lg items-center"
            >
              <div className=" hover:text-indigo-300 transition-all duration-500 font-medium py-3.5 text-violeta flex justify-center items-center mx-2 text-base lg:text-base lg:mx-5 xl:mx-8 xl:text-base">
                Alertas
              </div>
            </Link>
            <Link
              to="/Mapa"
              component={RouterLink}
              fontSize={18}
              color="indigo-500"
              underline="none"
              className="py-2 rounded-e-lg flex  text-violeta text-lg items-center"
            >
              <div className=" hover:text-indigo-300 transition-all duration-500 font-medium py-3.5 text-violeta flex justify-center items-center mx-2 text-base lg:text-base lg:mx-5 xl:mx-8 xl:text-base">
                Mapas
              </div>
            </Link>
            <Link
              to="/Relatorios"
              component={RouterLink}
              fontSize={18}
              color="indigo-500"
              underline="none"
              className="py-2 rounded-e-lg flex  text-violeta text-lg items-center"
            >
              <div className=" hover:text-indigo-300 transition-all duration-500 font-medium py-3.5 text-violeta flex justify-center items-center mx-2 text-base lg:text-base lg:mx-5 xl:mx-8 xl:text-base">
                Relatórios
              </div>
            </Link>
          </div>
        </div>
        <div className="bg-white w-3/12 flex h-[54px] justify-between my-auto xl:w-4/12 2xl:w-3/12">
           <Link to={{ pathname: "/Login", search: "?mode=register" }} component={RouterLink} underline="none" className="py-2 rounded-e-lg flex  text-violeta text-lg items-center bg-puarple-900">
   <div className="hover:text-violeta transition-all duration-500 h-[54px] font-medium text-xs flex justify-center items-center
            text-login bg-swhite lg:mr-2 lg:text-base xl:text-base 2xl:mr-4 bg-read-700">
     Cadastre-se
   </div>
 </Link>

          <Link to={{ pathname: "/Login", search: "?mode=login" }} component={RouterLink} underline="none" className="w-6/12 h-[54px]">
   <div className="hover:text-indigo-500 transition-all duration-500 hover:bg-white hover:border-2 hover:border-violeta
            border-violeta border-2 bg-violeta w-full h-[54px] font-medium flex justify-center items-center text-white rounded-2xl lg:text-base xl:text-base">
     Login
   </div>
 </Link>
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
          md:hidden fixed top-0 left-0 h-svh overflow-y-auto w-7/12 bg-white text-white rounded-e-3xl z-50
          transform transition-transform duration-300 ease-in-out
          ${menuOpen ? "translate-x-0 " : "-translate-x-full "}
          ${
            menuOpen
              ? "shadow-[0_-5px_20px_0_rgba(0,0,0,0.1),_5px_0_10px_0_rgba(0,0,0,0.1),_0_5px_20px_0_rgba(91,97,179,0.1)]"
              : ""
          }
        `}
      >
        <div className="flex w-5/6 mx-auto justify-center py-6 mt-4 bg-white border-b-2 border-indigo-400">
          <div className=" text-2xl text-indigo-500 font-bold flex items-center justify-center">
            <img src={Logo} alt="" />
          </div>
        </div>

        <div className="flex flex-col gap-y-6 mt-10 items-start ">
          <a
            href="#"
            className=" bg-indigo-500 py-2 rounded-e-lg flex w-5/6 font-normal text-base text-white items-center z-30 shadow-[4px_5px_30px__rgba(91,97,179,0.7)]"
          >
            <HomeOutline
              className="text-white ml-3 mr-4 hover:cursor-default"
              style={{ fontSize: "2rem", fontWeight: "3rem" }}
            />
            Início
          </a>
          <Link
            to="/Dashboard"
            component={RouterLink}
            fontSize={18}
            color="indigo-500"
            underline="none"
            className="bg-white py-2 rounded-e-lg flex w-5/6 text-indigo-500 text-lg items-center hover:bg-indigo-200 hover:text-white transition-all duration-500"
          >
            <DashboardRoundedIcon
              className="text-indigo-500 ml-3 mr-4"
              style={{ fontSize: "2.2rem" }}
            />
            Dashboard
          </Link>
          <Link
            to="/Alertas"
            component={RouterLink}
            fontSize={18}
            color="indigo-500"
            underline="none"
            className="bg-white py-2 rounded-e-lg flex w-5/6 text-indigo-500 text-lg items-center hover:bg-indigo-200 hover:text-white transition-all duration-500"
          >
            <NotificationsActiveRoundedIcon
              className="text-indigo-500 ml-3 mr-4"
              style={{ fontSize: "2.2rem" }}
            />
            Alertas
          </Link>
          <Link
            to="/Mapas"
            component={RouterLink}
            fontSize={18}
            color="indigo-500"
            underline="none"
            className="bg-white py-2 rounded-e-lg flex w-5/6 text-indigo-500 text-lg items-center hover:bg-indigo-200 hover:text-white transition-all duration-500"
          >
            <MapIcon
              className="text-indigo-500 ml-3 mr-4"
              style={{ fontSize: "2.2rem" }}
            />
            Mapas
          </Link>
          <Link
            to="/Relatorios"
            component={RouterLink}
            fontSize={18}
            color="indigo-500"
            underline="none"
            className="bg-white py-2 rounded-e-lg flex w-5/6 text-indigo-500 text-lg items-center hover:bg-indigo-200 hover:text-white transition-all duration-500"
          >
            <AssessmentOutlinedIcon
              className="text-indigo-500 ml-3 mr-4"
              style={{ fontSize: "2.2rem" }}
            />
            Relatórios
          </Link>
        </div>
        <Link to={{ pathname: "/Login", search: "?mode=login" }} component={RouterLink} fontSize={18} color="white" underline="none">
  <div className="bg-violeta w-5/6 mx-auto h-12 mt-10 items-center absolute bottom-24 flex justify-center rounded-xl text-xl left-1/2 -translate-x-1/2 border-2 font-semibold hover:bg-white hover:text-indigo-500 hover:border-indigo-500 transition-all duration-700">
    Login
  </div>
</Link>
        <Link to={{ pathname: "/Login", search: "?mode=register" }} component={RouterLink} fontSize={18} color="white" underline="none">
  <div className="bg-white w-5/6 mx-auto h-12 mt-6 items-center bottom-8 absolute flex justify-center left-1/2 -translate-x-1/2 text-indigo-500 rounded-xl text-xl font-semibold border-2 border-white hover:border-indigo-500 transition-all duration-700">
    Cadastrar-se
  </div>
</Link>
      </div>

      {/* final do código referente a sidebar mobile aberta */}

      {/* começo do código para o primeiro container da home */}

      <div className="h-[672px] w-full flex flex-col sm:h-[800px] mt-14 md:h-[840px] md:mt-20 lg:h-[1180px] xl:h-[1400px]">
        {/* código referente ao conteiner superior  */}
        <div
          className="w-11/12 h-1/2 bg-bege border-borda border-4 rounded-3xl mx-auto flex flex-col
        sm:min-h-96
        md:min-h-[420px]
        lg:min-h-[680px]
        2xl:min-h-[800px]"
        >
  <div className="absolute w-6 h-6 bg-broxa rounded-full top-72 left-80 opacity-100 hidden xl:block"></div>
  <div className="absolute w-9 h-9 bg-bsalmao rounded-full top-80 right-1/3 opacity-100 hidden xl:block"></div>
  <div className="absolute w-5 h-5 bg-bvermelho rounded-full top-72 right-72 opacity-100 hidden xl:block"></div>

          <div
            className="w-5/12 h-8 bg-white text-sm flex justify-center items-center rounded-2xl text-violeta mx-auto mt-12 shadow-[0px_0px_5px_4px_rgba(25,27,64,0.03)]
          sm:w-4/12 sm:h-9
          md:w-3/12
          lg:w-2/12 lg:mt-36
          xl:h-10 xl:text-base
          2xl:text-lg 2xl:w-48"
          >
            Controle o Fluxo
          </div>
          <div
            className="w-11/12 h-22 text-lg justify-center items-center text-center font-bold mx-auto mt-8 text-azulEscuro
          sm:text-2xl
          md:text-3xl
          lg:px-24 lg:text-4xl lg:mt-20
          xl:text-5xl
          2xl:px-48 2xl:text-5xl"
          >
            Explore Dados em Fluxo e Monitore o Essencial em Tempo Real.
          </div>
          <div
            className="w-11/12 h-22 text-xs justify-center items-center text-center font-base mx-auto mt-3 text-azulEscuro
          sm:text-sm
          md:text-base md:mt-8
          lg:text-xl lg:px-48 lg:mt-6
          2xl:text-[18px] 2xl:px-64"
          >
            Visualize, analise e tome decisões com base em dados reais,
            utilizando o sistema inteligente, Fluxum.
          </div>
          <div
            className="flex justify-center gap-8 w-4/6 mx-auto mt-8
          md:w-1/2
          lg:mt-18
          2xl:mt-12 2xl:w-2/6"
          >
            <a href="/Login"
              className="w-5/12 h-8 bg-violeta text-white flex justify-center items-center rounded-xl cursor-pointer border-2 border-violeta hover:bg-transparent hover:text-violeta hover:border-violeta hover:border-2 duration-500 shadow-[0px_0px_2px_1px_rgba(25,27,64,0.03)]
            sm:h-9
            lg:h-10
            xl:w-4/12
            2xl:text-lg"
            >
              Iniciar
            </a>
              <div className="absolute w-4 h-4 bg-bamarelo rounded-full top-1/5 left-96 opacity-100 hidden xl:block"></div>
            <a href="/dashboard"
              className="w-5/12 h-8 bg-white flex justify-center items-center rounded-xl text-violeta cursor-pointer hover:bg-violeta hover:text-white duration-500 shadow-[0px_0px_5px_4px_rgba(25,27,64,0.05)]
            sm:h-9
            lg:h-10
            xl:w-4/12
            2xl:text-lg"
            >
              Explorar
            </a>
            <div className="absolute w-7 h-7 bg-bazul rounded-full top-1/5 right-96 opacity-100 hidden xl:block"></div>
          </div>
        </div>

        <div
          className="w-11/12 h-7/12 z-80 bg-violeta rounded-2xl mx-auto flex justify-between border-4 border-violeta -mt-6 md:min-h-[440px]
        lg:min-h-[500px]
        2xl:min-h-[600px]"
        >
          <div className="absolute w-5 h-5 bg-bvermelho rounded-full top-1/12 right-72 opacity-100 hidden xl:block"></div>
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
                className="text-sm mt-2 font-GT font-bold text-white
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
            <div className="absolute w-8 h-8 bg-bsalmao rounded-full top-3/4 left-[820px] hidden xl:block"></div>
            <img src={NotRisco} className="ml-2 mb-0.3 sm:hidden" alt="" />
          </div>
          <div
            className="flex my-auto w-5/12 mr-2 h-full md:h-5/6 md-lg:h-full md:-rotate-[25deg] 
          xl:ml-0 xl:mr-0
          2xl:mr-16 2xl:-mat-6"
          >
            <div className="absolute w-5 h-5 bg-bvermelho rounded-full -top-14 left-44 hidden xl:block"></div>
            <img
              src={Celular}
              alt=""
              className="w-full rounded-[25px] mx-auto my-auto md:w-auto  md:h-full md:shadow-black/55 md:shadow-2xl z-30"
            />
            <div
              className="flex flex-col justify-start h-1/2 bga-red-600 md:h-[170px]
            lg:h-72"
            >
              <div className="absolute w-9 h-9 bg-bsalmao rounded-full -top-16 -left-9 hidden xl:block"></div>
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

      <div
        className="w-11/12 bga-red-900 flex flex-col mx-auto bag-yellow-600 mt-6
          sm:mt-20
          xl:flex-row xl:justify-between xl:mt-52"
      >
        <div className="lg:flex xl:w-2/3 xl:justify-between">
          <div
            className="w-full h-60 flex bg-white rounded-xl mx-auto flex-col
          sm:h-80
          md:h-96
          lg:w-5/12 lg:h-72
          xl:w-96
          2xlw-[520px]:"
          >
            <img
              src={F11}
              alt=""
              className="w-20 mt-4 ml-6 mb-4 sm:mt-8
            lg:mt-4"
            />
            <div className="absolute w-6 h-6 bg-bazul rounded-full top-[2150px] left-[180px] hidden xl:block"></div>
            <div
              className="text-2xl font-bold text-azulEscuro font-GT mt-3 ml-6
            sm:text-4xl sm:mt-6
            md:text-3xl md:mt-8
            lg:text-2xl lg:mt-4"
            >
              Fluxo Monitorado
            </div>
            <div
              className="mt-4 ml-6 text-base text-azulEscuro pr-4
            sm:text-base
            md:text-xl
            lg:text-sm"
            >
              Controle o fluxo de seus contâineres com nosso dashboard inteligente.
            </div>
          </div>

          <div
            className="w-full h-96 pl-3 pr-3 flex bg-white rounded-xl mx-auto flex-col shadow-[0px_30px_60px_rgba(0,0,0,0.1)] z-20
          sm:h-80
          md:h-96
          lg:w-5/12 lg:h-72 lg:shadow-none lg:-z-10
          xl:w-96
          xl:shadow-[0px_30px_60px_rgba(0,0,0,0.1)] xl:z-20
          2xl:w-[420px] 2xl:rounded-[50px]"
          >
            <img
              src={F12}
              alt=""
              className="w-20 mt-4 mb-4 ml-6 sm:mt-8
            lg:mt-4"
            />
            <div
              className="text-2xl font-bold  text-azulEscuro font-GT mt-3 ml-6
            sm:text-4xl sm:mt-6
             md:text-3xl md:mt-8
             lg:text-2xl lg:mt-4"
            >
              Decisões Rápidas
            </div>
            <div
              className="mt-4 ml-6 text-base text-azulEscuro pr-4
            sm:text-base
            md:text-xl
            lg:text-sm"
            >
              Visualize, analise e tome decisões com base em dados reais,
              utilizando o sistema inteligente, Fluxum.
            </div>
          </div>
        </div>

        <div
          className="w-full h-60 flex bg-white rounded-xl mx-auto flex-col  mt-4 -z-10
          sm:h-80
          md:h-96
          lg:shadow-[0px_0px_20px_6px_rgba(25,27,64,0.15)] lg:z-20 lg:mt-8 lg:h-80
          xl:shadow-none xl:mt-0 xl:w-96 xl:h-72 xl:-z-10
          2xl:w-[520px]"
        >
          <img
            src={F13}
            alt=""
            className="w-20 mt-4 ml-6 mb-4 sm:mt-8
            lg:mt-4"
          />
          <div
            className="text-2xl font-bold  text-azulEscuro font-GT mt-5 ml-6
            sm:text-4xl sm:mt-6
             md:text-3xl md:mt-8
             lg:mt-4
             xl:text-2xl"
          >
            Detecte Riscos
          </div>
          <div
            className="mt-4 ml-6 text-base text-azulEscuro pr-4 
            sm:text-base
            md:text-base
            lg:text-lg 
            xl:text-sm xl:font-normal xl:pr-6"
          >
            Receba notificações automáticas sobre movimentações incomuns,
            atrasos ou situações críticas no fluxo portuário.
          </div>
        </div>
      </div>

      {/* Começo do container de dúvidas frequentes */}

<div className="w-full mt-12 flex flex-col items-center">
  <div
    className="w-2/3 min-h-8 bg-white text-sm flex justify-center mt-4 items-center rounded-[20px] text-violeta mx-auto shadow-[0px_0px_10px_rgba(91,97,179,0.25)]
      sm:w-2/12 sm:h-11 sm:text-lg sm:mt-16
      md:w-2/12 md:text-lg md:h-12 md:mt-24
      lg:w-2/12 lg:text-lg lg:h-10 lg:mt-32
      xl:w-2/12
      2xl:text-lg 2xl:mt-36"
  >
    Perguntas Frenquentes
  </div>

  <div className="w-11/12 mx-auto mt-16">
    <div className="text-3xl font-bold relative font-GT text-azulEscuro
  sm:text-4xl
  md:text-5xl
  lg:text-[42px] lg:mb-12
  2xl:mt-10
  text-left
">
  Principais <br /> Perguntas Frequentes
</div>

    

    <div className="lg:flex mt-8 lg:justify-between lg:items-start">
    <div className="flex flex-col w-full gap-y-7 lg:w-1/2 mx-auto lg:mx-0">
      {faqData.map((item, index) => (
        <FaqComponent
          key={index}
          question={item.question}
          answer={item.answer}
        />
      ))}
    </div>

      
            <div className="absolute w-8 h-8 bg-bsalmao rounded-full top-[1800px] right-[180px] hidden xl:block"></div>

      <img
        src={F14}
        alt=""
        className="hidden lg:flex w-5/12 my-auto" 
      />

      
            <div className="absolute w-8 h-8 bg-bazul rounded-full top-[2500px] right-[180px] hidden xl:block"></div>
    </div>
  </div>
</div>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
};

export default App;
