import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, clearToken, setOnUnauthorized } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  // si hay un token guardado, hay que confirmar con el servidor que sigue valiendo
  const [cargando, setCargando] = useState(() => Boolean(getToken()));
  const [sesionExpirada, setSesionExpirada] = useState(false);

  // si cualquier petición marca error, se cierra la sesión en la app
  useEffect(() => {
    setOnUnauthorized(() => {
      setUsuario(null);
      setSesionExpirada(true);
    });
    return () => setOnUnauthorized(null);
  }, []);

  // al abrir la app con un token guardado recupera al usuario
  useEffect(() => {
    if (!getToken()) return undefined;
    let activo = true;

    api.get('/api/auth/me')
      .then((datos) => {
        if (activo) setUsuario(datos);
      })
      .catch(() => {
       
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const datos = await api.post('/api/auth/login', { email, password });
    setToken(datos.token);
    setSesionExpirada(false);
    setUsuario(datos.usuario);
    return datos.usuario;
  }, []);

  const registro = useCallback((datos) => api.post('/api/auth/registro', datos), []);

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
    }
    clearToken();
    setSesionExpirada(false);
    setUsuario(null);
  }, []);

  // después de editar el perfil: actualiza los datos que muestra la app sin volver a iniciar sesión
  const actualizarUsuario = useCallback((parcial) => {
    setUsuario((previo) => (previo ? { ...previo, ...parcial } : previo));
  }, []);

  // cierra la sesión solo en la app (sin avisar al servidor): se usa al eliminar la cuenta, porque ese token ya no es válido
  const cerrarSesionLocal = useCallback(() => {
    clearToken();
    setSesionExpirada(false);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      esAdmin: usuario?.rol === 'admin',
      sesionExpirada,
      login,
      registro,
      logout,
      actualizarUsuario,
      cerrarSesionLocal
    }),
    [usuario, cargando, sesionExpirada, login, registro, logout, actualizarUsuario, cerrarSesionLocal]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return contexto;
}
