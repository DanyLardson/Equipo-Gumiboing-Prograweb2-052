// Validaciones del back end (independientes de las del front).
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

function validarForo(body = {}) {
  const titulo = texto(body.titulo);
  const descripcion = texto(body.descripcion);

  if (!titulo) return { error: 'Falta el título del foro' };
  if (titulo.length > 150) return { error: 'El título es muy largo (máximo 150 caracteres)' };
  if (descripcion.length > 2000) {
    return { error: 'El mensaje inicial es muy largo (máximo 2000 caracteres)' };
  }

  return { datos: { titulo, descripcion } };
}

function validarMensajeForo(body = {}) {
  const cuerpo = texto(body.texto);

  if (!cuerpo) return { error: 'El mensaje está vacío' };
  if (cuerpo.length > 1000) return { error: 'El mensaje es muy largo (máximo 1000 caracteres)' };

  return { datos: { texto: cuerpo } };
}

// Deben coincidir con los enum de models/Reporte.js
const TIPOS_REPORTE = ['Resena', 'Comentario', 'MensajeForo'];
const ESTADOS_REPORTE = ['pendiente', 'revisado', 'eliminado'];

function validarReporte(body = {}) {
  const tipo = texto(body.tipo);
  const contenido = texto(body.contenido);
  const razon = texto(body.razon);

  if (!TIPOS_REPORTE.includes(tipo)) return { error: 'Tipo de contenido inválido' };
  if (!/^[0-9a-fA-F]{24}$/.test(contenido)) return { error: 'Contenido inválido' };
  if (!razon) return { error: 'Indica el motivo del reporte' };
  if (razon.length > 300) return { error: 'El motivo es muy largo (máximo 300 caracteres)' };

  return { datos: { tipo, contenido, razon } };
}

// El admin solo puede alternar entre pendiente y revisado.
// "eliminado" se asigna únicamente al borrar el contenido reportado.
function validarEstadoReporte(body = {}) {
  const estado = texto(body.estado);
  if (!['pendiente', 'revisado'].includes(estado)) {
    return { error: 'Estado inválido (usa "pendiente" o "revisado")' };
  }
  return { datos: { estado } };
}

module.exports = {
  GENEROS, TIPOS_REPORTE, ESTADOS_REPORTE,
  validarPelicula, validarResena, validarComentario, validarForo, validarMensajeForo,
  validarReporte, validarEstadoReporte
};
