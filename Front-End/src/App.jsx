import { useState } from "react";
import Fluxum from "./assets/fluxum.svg";

function App() {
  return (
    <div className="bg-white flex flex-col w-full h-full">
      <div className="bg-white flex w-1778 h-87 m-auto mt-14 rounded-2xl py-4 px-4">
        <img src={Fluxum} alt="" className="ml-8"/>

        <div className="bg-slate-100 flex ml-32 rounded-full w-[840px] h-[58px]">
          <div className="w-[181px] h-[58px] rounded-full flex justify-center items-center bg-indigo-500 text-x1 text-white shadow-[5px_0_10px_0_rgba(91,97,179,0.4)]">
            Início
          </div>
          <div className="font-medium text-indigo-500 text-xl flex justify-center items-center ml-8">
            Dashboard
          </div>
          <div className="font-medium text-indigo-500 text-xl flex justify-center items-center ml-16">
            Alertas
          </div>
          <div className="font-medium text-indigo-500 text-xl flex justify-center items-center ml-16">
            Mapas
          </div>
          <div className="font-medium text-indigo-500 text-xl flex justify-center items-center ml-16">
            Relatórios
          </div>
        </div>

      <div className="w-[181px] h-[54px] font-medium flex justify-center items-center text-xl text-indigo-700 ml-44">Cadastre-se</div>

      <div className="bg-indigo-500 w-[181px] h-[54px] font-medium flex justify-center items-center text-xl text-white ml-8 rounded-2xl">Login</div>

      </div>
    </div>
  );
}

export default App;
