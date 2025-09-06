import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Home from './Pages/Home.jsx'
import Dashboard from './Pages/Dashboard.jsx'
import Alertas from "./Pages/Alertas.jsx";
import Mapa from "./Pages/Mapa.jsx";
import Relatorios from "./Pages/Relatorios.jsx";
import Login from "./Pages/Login.jsx";
import Register from "./Pages/Register.jsx";

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/Dashboard',
    element: <Dashboard />,
  },
    {
    path: '/Alertas',
    element: <Alertas />,
  },
    {
    path: '/Mapa',
    element: <Mapa />,
  },
    {
    path: '/Relatorios',
    element: <Relatorios />,
  },
    {
    path: '/Login',
    element: <Login />,
  },
    {
    path: '/Register',
    element: <Register />,
  }
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {}
    <RouterProvider router={router} />
  </StrictMode>,
)