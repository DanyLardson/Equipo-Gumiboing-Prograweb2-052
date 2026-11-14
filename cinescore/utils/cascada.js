// Borrado en cascada: al borrar algo también se borra lo que depende de eso.
const {
  Pelicula, Resena, Comentario, Foro, MensajeForo, Reporte
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
