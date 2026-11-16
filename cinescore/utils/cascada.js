// borrado en cascada: al borrar algo también se borra lo que depende de eso.

// los reportes que apuntaban al contenido borrado:
// por defecto se borran (para que no queden huérfanos pipipi).
// con { conservarReportes: true } se conservan como historial y quedan con estado "eliminado" (lo usa la moderación del admin).
const {
  Usuario, Pelicula, Resena, Comentario, Foro, MensajeForo, Reporte,
  Amistad, Conversacion, MensajeChat
} = require('../models');
const logger = require('./logger');

async function ids(Modelo, filtro) {
  return (await Modelo.find(filtro).select('_id')).map(d => d._id);
}

async function tratarReportes(tipo, listaIds, opts = {}) {
  if (!listaIds.length) return 0;
  const filtro = { tipo, contenido: { $in: listaIds } };
  if (opts.conservarReportes) {
    const r = await Reporte.updateMany(filtro, { estado: 'eliminado' });
    return r.modifiedCount;
  }
  const r = await Reporte.deleteMany(filtro);
  return r.deletedCount;
}

async function borrarComentarios(filtro, opts = {}) {
  const lista = await ids(Comentario, filtro);
  if (!lista.length) return 0;
  await tratarReportes('Comentario', lista, opts);
  const r = await Comentario.deleteMany({ _id: { $in: lista } });
  return r.deletedCount;
}

async function borrarResenas(filtro, opts = {}) {
  const lista = await ids(Resena, filtro);
  if (!lista.length) return 0;
  await borrarComentarios({ resena: { $in: lista } }, opts);
  await tratarReportes('Resena', lista, opts);
  const r = await Resena.deleteMany({ _id: { $in: lista } });
  return r.deletedCount;
}

async function borrarMensajesForo(filtro, opts = {}) {
  const lista = await ids(MensajeForo, filtro);
  if (!lista.length) return 0;
  await tratarReportes('MensajeForo', lista, opts);
  const r = await MensajeForo.deleteMany({ _id: { $in: lista } });
  return r.deletedCount;
}

async function borrarForos(filtro, opts = {}) {
  const lista = await ids(Foro, filtro);
  if (!lista.length) return 0;
  await borrarMensajesForo({ foro: { $in: lista } }, opts);
  const r = await Foro.deleteMany({ _id: { $in: lista } });
  return r.deletedCount;
}

async function borrarPelicula(peliculaId, opts = {}) {
  const resenas = await borrarResenas({ pelicula: peliculaId }, opts);
  const foros = await borrarForos({ pelicula: peliculaId }, opts);
  await tratarReportes('Pelicula', [peliculaId], opts);
  await Pelicula.deleteOne({ _id: peliculaId });
  logger.info('Borrado en cascada de película', {
    peliculaId: String(peliculaId), resenas, foros
  });
}

// borra un usuario y todo lo suyo: reseñas, comentarios, mensajes y foros, likes, reportes que hizo, amistades y conversaciones.
// las películas que agregó se conservan (el catálogo no se pierde); quedan sin dueño y solo un admin puede editarlas.
async function borrarUsuario(userId) {
  const peliculasAfectadas = await Resena.distinct('pelicula', { usuario: userId });

  const resenas = await borrarResenas({ usuario: userId });
  const comentarios = await borrarComentarios({ usuario: userId });
  const mensajesForo = await borrarMensajesForo({ usuario: userId });
  const foros = await borrarForos({ creadoPor: userId });

  // los likes en contenido de otras personas
  await Resena.updateMany({ likes: userId }, { $pull: { likes: userId } });
  await Comentario.updateMany({ likes: userId }, { $pull: { likes: userId } });
  await MensajeForo.updateMany({ likes: userId }, { $pull: { likes: userId } });

  await Reporte.deleteMany({ reportadoPor: userId });
  await Amistad.deleteMany({ $or: [{ solicitante: userId }, { destinatario: userId }] });

  const conversaciones = await ids(Conversacion, { participantes: userId });
  await MensajeChat.deleteMany({ conversacion: { $in: conversaciones } });
  await Conversacion.deleteMany({ _id: { $in: conversaciones } });

  await Usuario.deleteOne({ _id: userId });

  logger.info('Borrado en cascada de usuario', {
    userId: String(userId), resenas, comentarios, mensajesForo, foros,
    conversaciones: conversaciones.length
  });
  return { peliculasAfectadas };
}

module.exports = {
  borrarPelicula, borrarResenas, borrarComentarios, borrarForos, borrarMensajesForo,
  borrarUsuario
};
