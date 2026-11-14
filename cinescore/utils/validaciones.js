// Validaciones del back end (independientes de las del front).
// Cada función devuelve { error, datos }: si "error" trae texto, no se debe guardar.

// Debe coincidir con el enum de models/Pelicula.js
const GENEROS = ['Drama', 'Ciencia ficción', 'Comedia', 'Suspenso', 'Terror', 'Acción', 'Animación'];

function texto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function validarPelicula(body = {}) {
  const titulo = texto(body.titulo);
  const director = texto(body.director);
  const genero = texto(body.genero);
  const sinopsis = texto(body.sinopsis);
  const poster = texto(body.poster);
  const anio = Number(body.anio);

  if (!titulo) return { error: 'Falta el título' };
  if (titulo.length > 150) return { error: 'El título es muy largo (máximo 150 caracteres)' };
  if (!director) return { error: 'Falta el director' };
  if (director.length > 100) return { error: 'El director es muy largo (máximo 100 caracteres)' };
  if (!Number.isInteger(anio) || anio < 1888 || anio > new Date().getFullYear() + 1) {
    return { error: 'El año es incorrecto' };
  }
  if (!GENEROS.includes(genero)) return { error: 'Género inválido' };
  if (sinopsis.length > 2000) return { error: 'La sinopsis es muy larga (máximo 2000 caracteres)' };
  if (poster && (poster.length > 500 || !/^https?:\/\//i.test(poster))) {
    return { error: 'El póster debe ser una URL que empiece con http:// o https://' };
  }

  return { datos: { titulo, anio, director, genero, sinopsis, poster } };
}

function validarResena(body = {}) {
  const calificacion = Number(body.calificacion);
  const titulo = texto(body.titulo);
  const cuerpo = texto(body.texto);

  if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
    return { error: 'La calificación debe ser un número entero del 1 al 5' };
  }
  if (!titulo) return { error: 'Falta el título de la reseña' };
  if (titulo.length > 120) return { error: 'El título es muy largo (máximo 120 caracteres)' };
  if (!cuerpo) return { error: 'Falta el texto de la reseña' };
  if (cuerpo.length > 3000) return { error: 'La reseña es muy larga (máximo 3000 caracteres)' };

  return { datos: { calificacion, titulo, texto: cuerpo } };
}

function validarComentario(body = {}) {
  const cuerpo = texto(body.texto);

  if (!cuerpo) return { error: 'El comentario está vacío' };
  if (cuerpo.length > 500) return { error: 'El comentario es muy largo (máximo 500 caracteres)' };

  return { datos: { texto: cuerpo } };
}

module.exports = { GENEROS, validarPelicula, validarResena, validarComentario };
