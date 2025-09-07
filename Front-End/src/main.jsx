// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';

import './index.css';

import Home from './Pages/Home.jsx';
import Dashboard from './Pages/Dashboard.jsx';
import Alertas from './Pages/Alertas.jsx';
import Mapa from './Pages/Mapa.jsx';
import Relatorios from './Pages/Relatorios.jsx';
import Login from './Pages/Login.jsx';
import Perfil from './Pages/Perfil.jsx';


import PrivateRoute from './routes/PrivateRoute.jsx';
import { AuthProvider } from './context/AuthContext.jsx';

import ResetPassword from './Pages/ResetPassword.jsx';

const router = createBrowserRouter([
  { path: '/', element: <Home /> },
  { path: '/Login', element: <Login /> },
  { path: '/reset-password', element: <ResetPassword /> }, 
  { path: '/Perfil', element: <Perfil /> },

  {
    element: <PrivateRoute />,
    children: [
      { path: '/Dashboard', element: <Dashboard /> },
      { path: '/Alertas', element: <Alertas /> },
      { path: '/Mapa', element: <Mapa /> },
      { path: '/Relatorios', element: <Relatorios /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
);
