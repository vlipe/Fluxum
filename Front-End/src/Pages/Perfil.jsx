import { useState, useRef } from "react";
import Sidebar2 from "../Components/Sidebar2";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FotoDefault from "../assets/assetsLogin/usuario.png";

const FormInput = ({ label, type = 'text', name, defaultValue, placeholder, readOnly = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm text-azulEscuro mb-2">
      {label}
    </label>
    <input
      type={type}
      name={name}
      id={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`mt-2.5 w-full p-3 bg-slate-100 text-roxo text-[13px] placeholder-roxo/50 placeholder:text-[13px] rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-violeta transition duration-300 ${readOnly ? 'cursor-not-allowed' : ''}`}
    />
  </div>
);

const Dashboard = () => {
  const [profileImage, setProfileImage] = useState(FotoDefault);
  const fileInputRef = useRef(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    } else {
      alert("Por favor, selecione uma imagem PNG ou JPG.");
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="min-h-screen w-full bg-deletar flex flex-row">
      <Sidebar2 />

      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <h1 className="text-lg sm:text-2xl font-bold text-center text-azulEscuro mb-6">
          Meu Perfil
        </h1>

        <div className="w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-10">
          <form className="space-y-6">
            <div>
              <label className="block text-sm text-azulEscuro mb-2">
                Foto de Perfil
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
                <img
                  src={profileImage}
                  alt="Foto de Perfil"
                  className="w-20 h-20 rounded-full object-cover self-center sm:self-start"
                />

                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="w-full sm:w-auto px-5 py-2.5 bg-violeta text-white text-[12px] rounded-xl hover:bg-roxo transition-all duration-300"
                  >
                    Atualizar foto
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileImage(FotoDefault)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-deletar text-delete text-[12px] font-medium rounded-xl hover:bg-slate-200 transition-all duration-300"
                  >
                    Deletar foto
                  </button>
                </div>
              </div>
            </div>

            <FormInput
              label="Nome de Perfil"
              placeholder="Insira seu novo nome"
              name="profileName"
              defaultValue=""
            />

            <FormInput
              label="Email"
              type="email"
              name="email"
              defaultValue="emaildapessoa"
              readOnly
            />

            <FormInput
              label="Senha"
              name="currentPassword"
              type="password"
              defaultValue="senhadapessoa"
              readOnly
            />

            <FormInput
              label="Nova Senha"
              name="newPassword"
              type="password"
              placeholder="Insira a nova senha, se necessário."
            />

            <div className="pt-4">
              <button
                type="submit"
                className="w-full sm:w-1/5 h-10 text-[13px] pt-0.5 bg-violeta text-white rounded-xl hover:bg-roxo focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;