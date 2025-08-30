import Logo from "../assets/Logo.svg";
import Instagram from "../assets/Logo do instagram.svg";
import Github from "../assets/Logo do GitHub.svg";

const Footer = () => {
  return (
    <div className="w-full bg-white rounded-t-3xl pt-12 flex flex-col shadow-[0px_0_25px_2px_rgba(25,27,64,0.4)] xl:mt-64">
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
              <img src={Instagram} className="w-10" alt="" />
              <img src={Github} className="w-10 ml-8" alt="" />
            </div>
          </div>

          <div className="flex xl:hidden">
            <img src={Instagram} className="mt-6 w-8 mr-5" alt="" />
            <img src={Github} className="mt-6 w-8 mr-5" alt="" />
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
              <li>Início</li>
              <li>Dashboard</li>
              <li>Alertas</li>
              <li>Mapa</li>
              <li>Relatórios</li>
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
              <p>Iot</p>
              <p>Painel na nuvem</p>
              <p>RFID</p>
              <p>Segurança de dados</p>
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
              <p>Monitoramento</p>
              <p>Alertas</p>
              <p>Visualização gráfica</p>
              <p>Dados em nuvem</p>
              <p>Rastreabilidade logística</p>
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
