import { useState } from "react";


import { Link, useNavigate } from "react-router-dom";
import Logo from "../assets/logo.svg";
import GitHub from "../assets/assetsLogin/github.png";
import Google from "../assets/assetsLogin/google.png";
import WordPress from "../assets/assetsLogin/wordpress.png";
import Perigo from "../assets/assetsLogin/perigo.png";
import Calendário from "../assets/assetsLogin/calendario.png";
import Seta from "../assets/assetsLogin/seta.png";
import Container from "../assets/assetsLogin/container.png";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  
const API = import.meta.env.VITE_API_URL || "";


const loginWithGoogle = () => {
  window.location.href = `${API}/api/auth/google/start?mode=${isRegister ? 'register' : 'login'}`;
};

const loginWithGitHub = () => {
  window.location.href = `${API}/api/auth/github/start?mode=${isRegister ? 'register' : 'login'}`;
};


  async function handleSubmit() {
    setErr("");
    const n = name.trim();
    const em = email.trim();
    const pw = password.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);

    if (isRegister && !n) return setErr("Informe seu nome.");
    if (!emailOk) return setErr("Email inválido.");
    if (pw.length < 6) return setErr("Senha precisa ter pelo menos 6 caracteres.");

    setLoading(true);
    try {
      if (isRegister) {
        await register({ name: n, email: em, password: pw }, rememberMe);
      } else {
        await login({ email: em, password: pw }, rememberMe);
      }
      navigate("/Dashboard");
    } catch (e) {
      setErr(e?.message || "Erro ao autenticar");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit() {
    setErr("");
    const em = email.trim();
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em);
    if (!emailOk) return setErr("Email inválido.");

    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em }),
      });
      setErr("Se o e-mail existir, enviaremos instruções.");
    } catch {
      setErr("Erro ao solicitar recuperação.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full lg:w-2/4 flex flex-col justify-center items-center lg:items-start p-8 sm:p-16 gap-6">
        <Link to="/">
          <img src={Logo} alt="Logo" className="mt-0" />
        </Link>

        <h1 className="w-58 text-4xl font-bold text-azulEscuro">
          {isForgot
            ? "Recuperar acesso"
            : isRegister
            ? "Olá, seja bem-vindo(a)!"
            : "Bem-vindo (a) de volta!"}
        </h1>

        <p className="text-roxo text-sm w-80">
          {isForgot
            ? "Digite seu e-mail para enviarmos o link de redefinição."
            : isRegister
            ? "Estamos felizes por ver você aqui! Crie sua conta preenchendo os campos abaixo."
            : "Estamos felizes por ver você aqui novamente! Por favor, preencha os campos."}
        </p>

        {!isForgot && (
  <div className="flex gap-4 w-full mx-auto">
    <button
      className="flex-1 text-xs py-2 px-4 text-azulEscuro border-2 border rounded-2xl flex items-center justify-center gap-2 hover:text-roxo hover:bg-white hover:border-white transition-colors duration-300"
      type="button"
      onClick={loginWithGoogle}
    >
      <img src={Google} alt="Logo da Google" className="w-5 h-5" />
      {isRegister ? "Cadastrar com Google" : "Login com Google"}
    </button>

    <button
      className="flex-1 text-xs py-2 px-4 text-azulEscuro border-2 border rounded-2xl flex items-center justify-center gap-0.5 hover:text-roxo hover:bg-white hover:border-white transition-colors duration-300"
      type="button"
      onClick={loginWithGitHub}
    >
      <img src={GitHub} alt="Logo do GitHub" className="w-7 h-7 mr-1" />
      {isRegister ? "Cadastrar com GitHub" : "Login com GitHub"}
    </button>
  </div>
)}


        <div className="w-full border-t-2 border-gray-200 mt-1 mb-6 relative text-gray-200 text-sm">
          <span className="absolute -top-3 bg-white px-2 left-1/2 -translate-x-1/2">
            ou
          </span>
        </div>

        {isRegister && !isForgot && (
          <>
            <p className="text-roxo text-sm -mb-4">
              Nome <span className="text-red-600">*</span>
            </p>
            <input
              type="text"
              placeholder="Informe seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 text-sm text-azulEscuro border-2 border rounded-2xl placeholder:font-light placeholder-gray-300 placeholder:text-sm placeholder:pl-3 focus:border-roxo focus:ring-roxo focus:outline-none"
              required
            />
          </>
        )}

        <p className="text-roxo text-sm -mb-4">
          Email <span className="text-red-600">*</span>
        </p>
        <input
          type="email"
          placeholder="Informe seu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 text-sm text-azulEscuro border-2 border rounded-2xl placeholder:font-light placeholder-gray-300 placeholder:text-sm placeholder:pl-3 focus:border-roxo focus:ring-roxo focus:outline-none"
          required
        />

        {!isForgot && (
          <>
            <p className="text-roxo text-sm -mb-4">
              Senha <span className="text-red-600">*</span>
            </p>
            <input
              type="password"
              placeholder="Informe sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 text-sm border-2 border rounded-2xl placeholder:font-light placeholder-gray-300 placeholder:text-sm placeholder:pl-3 focus:border-roxo focus:ring-roxo focus:outline-none"
              required
              minLength={6}
            />
          </>
        )}

        <div className="flex justify-between w-full text-roxo text-sm hover:text-indigo-700">
          {!isForgot && (
            <label className="flex items-center gap-2 cursor-pointer relative">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={() => setRememberMe(!rememberMe)}
                className="w-5 h-5 appearance-none border-2 border-claro rounded-full checked:bg-claro relative peer duration-300"
              />
              <span className="absolute w-2 h-2 bg-white rounded-full left-1.5 top-1.5 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"></span>
              Me lembrar
            </label>
          )}

          {!isRegister && !isForgot && (
            <a
              href="#"
              className="text-sm text-roxo hover:text-indigo-700 duration-300"
              onClick={(e) => {
                e.preventDefault();
                setErr("");
                setIsForgot(true);
                setIsRegister(false);
              }}
            >
              Esqueceu a senha?
            </a>
          )}

          {isForgot && (
            <a
              href="#"
              className="text-sm text-roxo hover:text-indigo-700 duration-300 ml-auto"
              onClick={(e) => {
                e.preventDefault();
                setErr("");
                setIsForgot(false);
              }}
            >
              Voltar ao login
            </a>
          )}
        </div>

        {err && <p className="text-red-600 text-sm mt-1 w-full">{err}</p>}

        <button
          className="w-full bg-azulEscuro text-white font-light text-sm py-3 border-2 rounded-2xl mt-4 hover:bg-white hover:text-azulEscuro hover:font-medium hover:border-2 hover:border-azulEscuro duration-300 disabled:opacity-50"
          onClick={isForgot ? handleForgotSubmit : handleSubmit}
          disabled={loading}
          type="button"
        >
          {isForgot
            ? (loading ? "Enviando..." : "Enviar e-mail")
            : isRegister
            ? (loading ? "Cadastrando..." : "Cadastrar")
            : (loading ? "Entrando..." : "Entrar")}
        </button>

        {!isForgot && (
          <p className="text-gray-500 text-sm mt-2">
            {isRegister ? "Já tem uma conta? " : "Novo por aqui? "}
            <a
              href="#"
              className="underline text-roxo hover:text-azulEscuro duration-300"
              onClick={(e) => {
                e.preventDefault();
                setIsRegister(!isRegister);
                setIsForgot(false);
                setErr("");
              }}
            >
              {isRegister ? "Entre" : "Cadastre-se"}
            </a>
          </p>
        )}
      </div>

      <div className="hidden lg:flex w-1/2 flex-col items-center relative gap-10 rounded-t-2xl bg-gradient-to-r from-roxo via-[#191B40] via-100% to-indigo-500 p-6 md:p-10 border rounded-2xl mt-4 lg:mt-2 lg:mr-2 lg:mb-2">
        <div className="bg-white rounded-b-2xl p-6 shadow-md w-80 -translate-y-10 justify-center opacity-50">
          <p className="text-gray-700 font-bold leading-tight mb-14 -mt-2">
            A tecnologia é melhor quando reúne as pessoas.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <img className="w-10 h-10" src={WordPress} alt="Moço" />
            <div className="flex flex-col">
              <p className="font-bold text-xs mb-0.5">Matt Mullenweg</p>
              <p className="text-xs text-gray-700">criador do WordPress</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg w-80 p-4 z-20">
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

          <div className="flex h-40">
            <div className="flex flex-col justify-between h-full mr-2 text-gray-400 text-xs">
              <span>100</span><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span>
            </div>
            <div className="flex items-end justify-end h-full">
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

        <div className="bg-white rounded-t-2xl shadow-lg w-80 h-32 p-4 z-10 opacity-50 absolute bottom-0">
          <div className="flex justify-between items-center mb-4">
            <button className="w-10 h-10 flex items-center justify-center border rounded-xl border-2 text-gray-500">
              <img src={Container} alt="Ícone de Perigo" className="w-5 h-5 opacity-50" />
            </button>
            <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-400 rounded-lg text-sm">
              <img src={Calendário} alt="Ícone de Calendário" className="w-4 h-4 mr-2" />
              <p className="text-xs text-gray-400 mr-2">Último mês</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
