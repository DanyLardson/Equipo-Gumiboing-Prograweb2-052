import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Cargando from './Cargando';

// Solo para quien NO ha iniciado sesión (login y registro).
// Si ya hay sesión, redirige a la pantalla de inicio según el rol (o a donde iba antes del login).
export function RutaPublica() {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando />;
  if (usuario) {
    const destino = location.state?.desde?.pathname || (usuario.rol === 'admin' ? '/admin' : '/');
    return <Navigate to={destino} replace />;
  }
  return <Outlet />;
}

// Requiere sesión: sin ella, todo manda al login (y recuerda a dónde quería ir).
export function RutaPrivada() {
  const { usuario, cargando } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location }} />;
  return <Outlet />;
}

// Requiere sesión y rol admin: un usuario normal vuelve al inicio.
export function RutaAdmin() {
  const { usuario, cargando, esAdmin } = useAuth();
  const location = useLocation();

  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location }} />;
  if (!esAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}
