// Cliente de la API manda el token JWT en CADA petición 
const TOKEN_KEY = 'cinescore_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// error de la API
export class ApiError extends Error {
  constructor(mensaje, status) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

// El AuthContext registra aquí qué hacer cuando el servidor marca error (token vencido o inválido)
let alExpirarSesion = null;
export function setOnUnauthorized(fn) {
  alExpirarSesion = fn;
}

async function peticion(metodo, ruta, cuerpo) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(ruta, {
      method: metodo,
      headers,
      credentials: 'omit', // solo el token autentica, nunca las cookies
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo)
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor', 0);
  }

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch {
    // respuesta sin cuerpo JSON
  }

  if (!respuesta.ok) {
    // token vencido, falso o cuenta eliminada: se descarta y se avisa a la app
    // Login y registro también pueden marcar error, pero ahí no hay token que descartar
    if (respuesta.status === 401 && token) {
      clearToken();
      if (alExpirarSesion) alExpirarSesion();
    }
    throw new ApiError((datos && datos.error) || 'Error del servidor', respuesta.status);
  }

  return datos;
}

export const api = {
  get: (ruta) => peticion('GET', ruta),
  post: (ruta, cuerpo) => peticion('POST', ruta, cuerpo ?? {}),
  put: (ruta, cuerpo) => peticion('PUT', ruta, cuerpo ?? {}),
  delete: (ruta, cuerpo) => peticion('DELETE', ruta, cuerpo)
};
