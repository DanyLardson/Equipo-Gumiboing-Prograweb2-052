// validaciones del formulario (el backend vuelve a validar todo por su cuenta).
// cada función devuelve un texto de error o '' si el valor está bien.

const RE_USERNAME = /^[A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ._-]{3,30}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function errorUsername(valor) {
  return RE_USERNAME.test(valor.trim())
    ? ''
    : 'De 3 a 30 caracteres: letras, números, punto, guion o guion bajo';
}

export function errorEmail(valor) {
  return RE_EMAIL.test(valor.trim()) ? '' : 'Escribe un correo válido';
}

export function errorPassword(valor) {
  if (valor.length < 6) return 'Mínimo 6 caracteres';
  if (valor.length > 72) return 'Máximo 72 caracteres';
  return '';
}

export function errorBio(valor) {
  return valor.trim().length <= 300 ? '' : 'Máximo 300 caracteres';
}

// la foto es opcional, pero si se escribe debe ser un link
export function errorAvatar(valor) {
  const v = valor.trim();
  if (!v) return '';
  if (v.length > 500) return 'La dirección es muy larga';
  return /^https?:\/\//i.test(v) ? '' : 'Debe empezar con http:// o https://';
}

// texto genérico: obligatorio u opcional, con máximo de caracteres
export function errorTexto(valor, { etiqueta = 'Este campo', max, obligatorio = false }) {
  const v = String(valor).trim();
  if (!v) return obligatorio ? `${etiqueta} es obligatorio` : '';
  return v.length > max ? `Máximo ${max} caracteres` : '';
}

export function errorAnio(valor) {
  const n = Number(valor);
  const max = new Date().getFullYear() + 1;
  if (String(valor).trim() === '' || !Number.isInteger(n) || n < 1888 || n > max) {
    return `Escribe un año entre 1888 y ${max}`;
  }
  return '';
}
