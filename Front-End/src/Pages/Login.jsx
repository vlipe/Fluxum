    import Logo from "../assets/logo.svg";

    import Apple from "../assets/assetsLogin/apple.png";
    import Google from "../assets/assetsLogin/google.png";
    import WordPress from "../assets/assetsLogin/wordpress.png";
    import Perigo from "../assets/assetsLogin/perigo.png";
    import Calendário from "../assets/assetsLogin/calendario.png";
    import Seta from "../assets/assetsLogin/seta.png";

    const Dashboard = () => {
    return (
        <div className="min-h-screen flex">
        <div className="w-2/4 bg-white flex flex-col justify-center items-start p-16 gap-6">
                <img className="mt-0" src={Logo} alt="Logo" />
            <h1 className="w-58 text-4xl font-bold text-azulEscuro">Bem-vindo (a) de volta!</h1>
            <p className="text-roxo text-sm">Estamos felizes por ver você aqui novamente!</p>
            <p className="text-roxo text-sm -mt-6 ">Por favor, preencha os campos.</p>

            <div className="flex gap-4 w-full">
             <button className="flex-1 text-xs py-2 px-4 text-azulEscuro border-2 border rounded-2xl flex items-center justify-center gap-2
                   hover:text-white hover:bg-gray-200 hover:border-gray-50 hover:text-roxo transition-colors duration-300">
            <img src={Google} alt="Logo da Google" className="w-5 h-5" />
            Login com Google
            </button>
            <button className="flex-1 text-xs py-2 px-4 text-azulEscuro border-2 border rounded-2xl flex items-center justify-center gap-0.5
                   hover:text-white hover:bg-gray-200 hover:border-gray-50 hover:text-roxo transition-colors duration-300">
            <img src={Apple} alt="Logo da Apple" className="w-9 h-5" />
            Login com Apple
            </button>

            </div>

            <div className="w-full border-t-2 border-gray-200 mt-1 mb-6 relative text-gray-200 text-sm">
            <span className="absolute -top-3 bg-white px-2 left-1/2 -translate-x-1/2">ou</span>
            </div>

            <p className="text-roxo text-sm -mb-4">Email <span className="text-red-600">*</span></p>
            <input type="email" placeholder="Informe seu email" className="w-full p-2 text-sm text-azulEscuro border-2 border rounded-2xl placeholder:font-light placeholder-gray-300 placeholder:text-sm placeholder:pl-3 focus:border-roxo focus:ring-roxo focus:outline-none" />

            <p className="text-roxo text-sm -mb-4">Senha <span className="text-red-600">*</span></p>
            <input type="password" placeholder="Informe sua senha" className="w-full p-2 text-sm border-2 border rounded-2xl placeholder:font-light placeholder-gray-300 placeholder:text-sm placeholder:pl-3 focus:border-roxo focus:ring-roxo focus:outline-none" />

            <div className="flex justify-between w-full text-roxo text-sm hover:text-indigo-700">
            <label className="flex items-center gap-2 cursor-pointer relative">
            <input type="checkbox"className="w-5 h-5 appearance-none border-2 border-claro rounded-full checked:bg-claro relative peer duration-300"
  />
            <span className="absolute w-2 h-2 bg-white rounded-full left-1.5 top-1.5 opacity-0
                   peer-checked:opacity-100 transition-opacity pointer-events-none"></span>
                Me lembrar
                </label>



            <a href="#" className="text-sm text-roxo hover:text-indigo-700 duration-300">Esqueceu a senha?</a>
            </div>

            <button className="w-full bg-azulEscuro text-white font-light text-sm py-3 rounded-2xl mt-4 hover:bg-white hover:text-azulEscuro hover:font-medium hover:border-2 hover:border-azulEscuro duration-100">Entrar</button>
            <p className="text-gray-500 text-sm mt-2">
            Novo por aqui? <a href="#" className="underline text-roxo hover:text-azulEscuro duration-300">Cadastre-se</a>
            </p>
        </div>

            <div className="w-2/3 bg-gradient-to-r from-roxo via-[#191B40] via-100% to-indigo-500 p-10 border rounded-2xl radius flex flex-col gap-6">

            <div className="bg-white rounded-3xl p-6 shadow-md w-3/6 justify-center opacity-50">
            <p className="text-black text-lg font-bold leading-tight mb-14">
            A tecnologia é melhor quando reúne as pessoas.
            </p>

            <div className="flex items-center gap-4 mt-4">
    
            <img className="w-10 h-10" src={WordPress} alt="Moço"/>

            <div className="flex flex-col">
            <p className="font-bold text-sm">Matt Mullenweg</p>
            <p className="text-xs text-gray-700">criador do WordPress</p>
    </div>
  </div>
</div>


<div className="bg-white rounded-2xl shadow-lg p-4 w-80">
  <div className="flex justify-between items-center mb-4">
    <button className="w-10 h-10 flex items-center justify-center border rounded-xl border-2 text-gray-500">
      <img src={Perigo} alt="Ícone de Perigo" className="w-5 h-5 mb-0.5" />
    </button>
    <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm">
      <img src={Calendário} alt="Ícone de Calendário" className="w-4 h-4 mr-2" />
      <p className="text-xs text-gray-400 mr-2">Último mês</p>
    </button>
  </div>

  <div className="flex items-center gap-2 mt-11 mb-6">
    <p className="text-3xl font-GT font-bold text-cinza mr-2">+ 84.32%</p>
    <span className="bg-green-100 text-green-400 px-6 py-1 rounded-md text-sm">
      <img src={Seta} alt="Setinha para cima" className="w-5 mt-0.5" />
    </span>
  </div>

  <div className="flex items-end justify-end h-40">
    <div className="w-12 h-full bg-zinc-100 rounded-lg relative mr-3">
      <div className="absolute bottom-0 w-12 h-8 bg-claro rounded-lg opacity-20"></div>
    </div>

    <div className="w-12 h-full bg-zinc-100 rounded-lg relative mr-3">
      <div className="absolute bottom-0 w-12 h-16 bg-claro rounded-lg opacity-45"></div>
    </div>

    <div className="w-12 h-full bg-zinc-100 rounded-lg relative mr-3">
      <div className="absolute bottom-0 w-12 h-20 bg-claro rounded-lg opacity-75"></div>
    </div>

    <div className="w-12 h-full bg-zinc-100 rounded-lg relative">
      <div className="absolute bottom-0 w-12 h-28 bg-claro rounded-lg"></div>
    </div>
  </div>
</div>

        </div>
        </div>
    );
    };

    export default Dashboard;
