import Logo from "../assets/Logo.svg";


import Icon from "@mdi/react";
import { mdiInstagram } from "@mdi/js";
import { mdiGithub } from "@mdi/js";

const Footer = () => {
  return (
    <div className="w-full bg-white rounded-t-3xl xl:pt-12 flex flex-col shadow-[0px_0_25px_2px_rgba(25,27,64,0.4)] xl:mt-64">
      <div className="xl:flex ">
        <div
          className="flex justify-between xl:flex-col xl:justify-normal
      xl:w-1/4 xl:ml-10 "
        >
          <img
            src={Logo}
            alt=""
            className="w-2/12 mt-3 ml-3
        md:w-24 md:ml-9 xl:h-24 xl:mt-10"
          />

          <div className="hidden xl:flex flex-col">
            <div className=" ml-12 w-10/12 mt-4 text-gray-400 text-lg">
              Fluxum - Dashboard Inteligente com Computação em Nuvem Para
              Contâineres - Transformando o fluxo portuário com dados e
              inteligência.
            </div>
            <div className="hidden xl:flex ml-12 mt-6">
              <Icon
                path={mdiInstagram}
                className="mt-6 text-indigo-700 hover:text-indigo-300 transition-all duration-700 hover:scale-110"
                size={2.2}
              />
              <Icon
                path={mdiGithub}
                className="ml-4 mt-6 text-indigo-700 hover:text-indigo-300 transition-all duration-700 hover:scale-110"
                size={2.2}
              />
            </div>
          </div>

          <div className="flex xl:hidden">
            <Icon
              path={mdiInstagram}
              className="mt-8 mr-5 text-indigo-700 hover:text-indigo-300 transition-all duration-700 hover:scale-110"
              size={1.7}
            />
            <Icon
              path={mdiGithub}
              className="mt-8 mr-5 text-indigo-700 hover:text-indigo-300 transition-all duration-700 hover:scale-110"
              size={1.7}
            />
          </div>
        </div>
        <div
          className="flex w-full bg-ared-700 justify-evenly px-1 mt-4
      xl:w-10/12 xl:mr-20 xl:mt-12"
        >
          <div className="flex flex-col w-1/3">
            <div
              className="text-xl font-bold text-indigo-500 mb-4 text-center
          xl:text-3xl"
            >
              Navegue
            </div>

            <div
              className="flex flex-col justify-center items-center text-indigo-700 text-center list-none gap-y-3 text-sm
          xl:text-xl xl:gap-y-6 xl:mt-4 xl:text-indigo-900"
            >
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Início</p>
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Dashboard</p>
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Alertas</p>
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Mapa</p>
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Relatórios</p>
            </div>
          </div>

          <div className="flex flex-col w-1/3 text-center">
            <div
              className="text-xl font-bold text-indigo-500 mb-4
          xl:text-2xl"
            >
              Tecnologias
            </div>

            <div
              className="flex flex-col justify-center items-center text-indigo-700 text-center list-none gap-y-3 text-sm
           xl:text-xl xl:gap-y-6 xl:mt-4 xl:text-indigo-900"
            >
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Iot</p>
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Painel na nuvem</p>
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">RFID</p>
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Segurança de dados</p>
            </div>
          </div>

          <div className="flex flex-col w-1/3 text-center">
            <div
              className="text-xl font-bold text-indigo-500 mb-4
          xl:text-2xl"
            >
              Soluções
            </div>

            <div
              className="flex flex-col text-indigo-700 gap-y-3 items-center justify-center text-center text-sm
           xl:text-xl xl:gap-y-6 xl:mt-4 xl:text-indigo-900"
            >
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Monitoramento</p>
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Alertas</p>
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Visualização gráfica</p>
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Dados em nuvem</p>
              <p className="hover:text-indigo-300 transition-all duration-500 hover:scale-110">Rastreabilidade logística</p>
            </div>
          </div>
        </div>
      </div>
      <div
        className="w-10/12 h-18 border-t-2 border-gray-400 mx-auto mt-6 mb-6 items-center justify-center text-center text-gray-400
      xl:hidden"
      >
        <br></br>© 2025 Fluxum. Todos os direitos reservados.
      </div>
      <div className="hidden  w-11/12 mx-auto xl:flex border-t-2 border-gray-400 justify-center items-center mt-20 mb-20 text-gray-400 text-2xl py-8">
        © 2025 Fluxum. Todos os direitos reservados.
      </div>
    </div>
  );
};

export default Footer;
