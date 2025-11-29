import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import Home from "./Pages/Home.jsx";
import Dashboard from "./Pages/dashboard.jsx";
import Alertas from "./Pages/Alertas.jsx";
import Relatorios from "./Pages/Relatorios.jsx";
import Login from "./Pages/Login.jsx";
import Perfil from "./Pages/Perfil.jsx";
import OAuthSuccess from "./Pages/OAuthSuccess.jsx";
import PrivateRoute from "./routes/PrivateRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import ResetPassword from "./Pages/ResetPassword.jsx";
import FormCad from "./Pages/FormCad.jsx";
import Lista from "./Pages/Lista.jsx";
import Navios from "./Pages/Navios.jsx";
import FormNavio from "./Pages/FormNavio.jsx";
import DetalhesNavio from "./Pages/DetalhesNavio.jsx";
import EditarNavio from "./Pages/EditarNavio.jsx";
import FormConteiner from "./Pages/FormConteiner.jsx";
import DetalhesConteiner from "./Pages/DetalhesConteiner.jsx";
import Viagens from "./Pages/Viagens.jsx";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/Login", element: <Login /> },
  { path: "/reset-password", element: <ResetPassword /> },
  { path: "/oauth/success", element: <OAuthSuccess /> },
  {
    element: <PrivateRoute />,
    children: [
      { path: "/Alertas", element: <Alertas /> },
      { path: "/Viagens", element: <Viagens /> },
      { path: "/Relatorios", element: <Relatorios /> },
      { path: "/Perfil", element: <Perfil /> },
      { path: "/Dashboard", element: <Dashboard /> },
      { path: "/Navios", element: <Navios /> },
      { path: "/FormCad", element: <FormCad /> },
      { path: "/Lista", element: <Lista /> },
      { path: "/FormNavio", element: <FormNavio /> },
      { path: "/DetalhesNavio", element: <DetalhesNavio /> },
      { path: "/EditarNavio", element: <EditarNavio /> },
      { path: "/FormConteiner", element: <FormConteiner /> },
      { path: "/DetalhesConteiner", element: <DetalhesConteiner /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
