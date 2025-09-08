// src/Pages/OAuthSuccess.jsx
import { useEffect, useRef } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function OAuthSuccess() {
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;

    (async () => {
      try {
        const r = await fetch(`${API}/api/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        });

        if (!r.ok) {
          window.location.replace("/");
          return;
        }

        const data = await r.json().catch((e) => {
          console.warn("Falha ao parsear JSON do /refresh", e);
          return null;
        });

        if (data?.accessToken) {
          try {
            localStorage.setItem("accessToken", data.accessToken);
          } catch (e) {
            console.warn("localStorage falhou:", e);
          }
          try {
            sessionStorage.setItem("accessToken", data.accessToken);
          } catch (e) {
            console.warn("sessionStorage falhou:", e);
          }
          window.location.replace("/Dashboard");
        } else {
          window.location.replace("/");
        }
      } catch (e) {
        console.warn("Falha ao chamar /api/auth/refresh:", e);
        window.location.replace("/");
      }
    })();
  }, []);

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif"}}>
      Conectando…
    </div>
  );
}
