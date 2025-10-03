import { useState, useRef } from "react";
import Sidebar2 from "../Components/Sidebar2";
import { useAuth } from "../context/AuthContext";
import FotoDefault from "../assets/assetsLogin/usuario.png";
import { apiFetch } from "../lib/api";
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../lib/cropImage';

const FormInput = ({ label, type = "text", name, defaultValue, placeholder, readOnly = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm text-azulEscuro mb-2">{label}</label>
    <input
      type={type}
      name={name}
      id={name}
      defaultValue={defaultValue}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`mt-2.5 w-full p-3 bg-slate-100 text-roxo text-[13px] placeholder-roxo/50 placeholder:text-[13px] rounded-xl border-none focus:outline-none focus:ring-2 focus:ring-violeta transition duration-300 ${readOnly ? "cursor-not-allowed" : ""}`}
    />
  </div>
);

export default function Perfil() {
  const [profileImage, setProfileImage] = useState(FotoDefault);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file && (file.type === "image/png" || file.type === "image/jpeg")) {
      const imageUrl = URL.createObjectURL(file);
      setImageToCrop(imageUrl);
    } else {
      alert("Por favor, selecione uma imagem PNG ou JPG.");
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const showCroppedImage = async () => {
    try {
      const croppedImageBlob = await getCroppedImg(
        imageToCrop,
        croppedAreaPixels
      );
      const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
      setProfileImage(croppedImageUrl);
      setImageToCrop(null);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  async function handleSave(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const me = await apiFetch("/api/users/me");
      const id = me?.id;
      if (!id) throw new Error("Usuário não identificado");
      const fd = new FormData(formRef.current);
      const payload = { name: fd.get("profileName")?.trim() || undefined };
      const newPass = fd.get("newPassword")?.trim();
      if (newPass) payload.password = newPass;
      await apiFetch(`/api/users/${id}`, { method: "PATCH", body: payload });
      alert("Dados salvos!");
    } catch (err) {
      alert(err.message || "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-deletar flex flex-row">
      <Sidebar2 />
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6">
        <h1 className="text-lg sm:text-2xl font-bold text-center text-azulEscuro mb-6">Meu Perfil</h1>
        <div className="w-full max-w-4xl bg-white rounded-3xl p-6 sm:p-10">
          <form ref={formRef} onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-sm text-azulEscuro mb-2">Foto de Perfil</label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
                <img 
  src={profileImage} 
  alt="Foto de Perfil" 
  className="w-20 h-20 rounded-full object-cover self-center sm:self-start max-[760px]:w-12 max-[760px]:h-12" 
/>

                <input type="file" accept="image/png, image/jpeg" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button type="button" onClick={triggerFileInput} className="w-full sm:w-auto px-5 py-2.5 bg-violeta text-white text-[12px] rounded-xl hover:bg-roxo transition-all duration-300">Atualizar foto</button>
                  <button type="button" onClick={() => setProfileImage(FotoDefault)} className="w-full sm:w-auto px-6 py-2.5 bg-deletar text-delete text-[12px] font-medium rounded-xl hover:bg-slate-200 transition-all duration-300">Deletar foto</button>
                </div>
              </div>
            </div>
            <FormInput label="Nome de Perfil" placeholder="Insira seu novo nome" name="profileName" defaultValue="" />
            <FormInput label="Email" type="email" name="email" defaultValue={user?.email || ""} readOnly />
            <FormInput label="Senha" name="currentPassword" type="password" defaultValue="********" readOnly />
            <FormInput label="Nova Senha" name="newPassword" type="password" placeholder="Insira a nova senha, se necessário." />
            <div className="pt-4">
              <button type="submit" className="w-full sm:w-1/5 h-10 text-[13px] pt-0.5 bg-violeta text-white rounded-xl hover:bg-roxo focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-300" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>

          {imageToCrop && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex flex-col items-center justify-center z-50">
              <div className="relative w-full max-w-lg h-96 bg-gray-800 rounded-lg">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="round"
                  showGrid={false}
                />
              </div>
              <div className="mt-4 flex gap-4">
                <button onClick={showCroppedImage} className="px-6 py-2 bg-violeta text-white rounded-lg">Cortar</button>
                <button onClick={() => setImageToCrop(null)} className="px-6 py-2 bg-gray-500 text-white rounded-lg">Cancelar</button>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}