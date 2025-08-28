import React, { useState } from "react";

// O componente agora recebe 'question' e 'answer' como props
const FaqComponent = ({ question, answer }) => {
  // Estado para controlar a visibilidade da resposta
  const [isOpen, setIsOpen] = useState(false);

  // Função para alternar o estado de abertura
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-10/12 mx-auto my-auto rounded-xl overflow-hidden">
      {/* Container da Pergunta */}
      <div
        className={`flex w-full h-24 justify-between bg-white border-2 border-gray-300 cursor-pointer
            md:text-xl
          ${isOpen ? "rounded-t-xl border-b-0" : "rounded-xl"}
        `}
        onClick={handleToggle}
      >
        <div className="my-auto ml-2 font-bold text-slate-700 pr-6">
          {question}
        </div>
        <div className="my-auto mr-8 text-3xl font-bold text-indigo-500 hover:scale-125 transition-all hover:text-indigo-300 duration-500">
          {isOpen ? "-" : "+"}
        </div>
      </div>

      {/* Container da Resposta, renderizado condicionalmente com transição */}
      <div
        className={`w-full bg-indigo-500 text-white transition-all duration-500 ease-in-out md:text-lg lg:text-base
          ${isOpen ? "max-h-[500px] opacity-100 p-4 -mt-2" : "max-h-0 opacity-0 p-0"}
          ${isOpen ? "rounded-b-xl" : ""}
        `}
      >
        <p className="my-auto">
          {answer}
        </p>
      </div>
    </div>
  );
};

export default FaqComponent;
