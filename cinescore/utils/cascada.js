// Borrado en cascada: al borrar algo también se borra lo que depende de eso
const {
  Pelicula, Resena, Comentario, Foro, MensajeForo, Reporte
} = require('../models');
const logger = require('./logger');

async function ids(Modelo, filtro) {
  return (await Modelo.find(filtro).select('_id')).map(d => d._id);
}

async function borrarReportesDe(tipo, listaIds) {
  if (!listaIds.length) return 0;
  const r = await Reporte.deleteMany({ tipo, contenido: { $in: listaIds } });
  return r.deletedCount;
}

async function borrarComentarios(filtro) {
  const lista = await ids(Comentario, filtro);
  if (!lista.length) return 0;
  await borrarReportesDe('Comentario', lista);
  const r = await Comentario.deleteMany({ _id: { $in: lista } });
  return r.deletedCount;
}

async function borrarResenas(filtro) {
  const lista = await ids(Resena, filtro);
  if (!lista.length) return 0;
  await borrarComentarios({ resena: { $in: lista } });
  await borrarReportesDe('Resena', lista);
  const r = await Resena.deleteMany({ _id: { $in: lista } });
  return r.deletedCount;
}

async function borrarMensajesForo(filtro) {
  const lista = await ids(MensajeForo, filtro);
  if (!lista.length) return 0;
  await borrarReportesDe('MensajeForo', lista);
  const r = await MensajeForo.deleteMany({ _id: { $in: lista } });
  return r.deletedCount;
}

async function borrarForos(filtro) {
  const lista = await ids(Foro, filtro);
  if (!lista.length) return 0;
  await borrarMensajesForo({ foro: { $in: lista } });
  const r = await Foro.deleteMany({ _id: { $in: lista } });
  return r.deletedCount;
}

async function borrarPelicula(peliculaId) {
  const resenas = await borrarResenas({ pelicula: peliculaId });
  const foros = await borrarForos({ pelicula: peliculaId });
  await Pelicula.deleteOne({ _id: peliculaId });
  logger.info('Borrado en cascada de película', {
    peliculaId: String(peliculaId), resenas, foros
  });
}

module.exports = {
  borrarPelicula, borrarResenas, borrarComentarios, borrarForos, borrarMensajesForo
};
