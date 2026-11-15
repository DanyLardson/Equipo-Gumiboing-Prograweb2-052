// Estadísticas para la sección "Reportes" del panel de admin.
// Todas las rutas son solo para admin y devuelven JSON.
//
//   GET /api/estadisticas/resumen             -> indicadores generales (para tarjetas)
//   GET /api/estadisticas/peliculas-top       -> consulta 1: películas mejor calificadas (películas + reseñas + comentarios + foros)
//   GET /api/estadisticas/usuarios-activos    -> consulta 2: usuarios más activos (usuarios + reseñas + comentarios + mensajes de foro + foros)
//   GET /api/estadisticas/contenido-reportado -> consulta 3: contenido más reportado (reportes + contenido + autor)
//   GET /api/estadisticas/generos             -> consulta 4: actividad por género (películas + reseñas + foros + mensajes de foro)

const express = require('express');
const logger = require('../utils/logger');
const {
  Usuario, Pelicula, Resena, Comentario, Foro, MensajeForo,
  Amistad, Conversacion, MensajeChat, Reporte
} = require('../models');
const { requireAdmin } = require('../middleware/auth');
const { ESTADOS_REPORTE } = require('../utils/validaciones');

const router = express.Router();

// Nombre real de la colección en MongoDB (lo necesita $lookup)
const col = (Modelo) => Modelo.collection.name;

// Lee un número entero de la URL; devuelve null si viene mal
function entero(valor, porDefecto, min, max) {
  if (valor === undefined || valor === '') return porDefecto;
  const n = Number(valor);
  if (!Number.isInteger(n) || n < min || n > max) return null;
  return n;
}

// Suma de likes de un arreglo de documentos (cada uno con su arreglo "likes")
const sumaLikes = (campo) => ({
  $sum: {
    $map: { input: campo, as: 'x', in: { $size: { $ifNull: ['$$x.likes', []] } } }
  }
});

// ---------------------------------------------------------------------
// Indicadores generales
// ---------------------------------------------------------------------
router.get('/resumen', requireAdmin, async (req, res) => {
  try {
    // Últimos 6 meses (incluye el actual)
    const desde = new Date();
    desde.setDate(1);
    desde.setHours(0, 0, 0, 0);
    desde.setMonth(desde.getMonth() - 5);

    const [
      usuarios, peliculas, resenas, comentarios, foros, mensajesForo,
      amistades, conversaciones, mensajesChat, reportes,
      porRol, porEstado, promedio, sinResenas, porMes
    ] = await Promise.all([
      Usuario.countDocuments(), Pelicula.countDocuments(), Resena.countDocuments(),
      Comentario.countDocuments(), Foro.countDocuments(), MensajeForo.countDocuments(),
      Amistad.countDocuments(), Conversacion.countDocuments(), MensajeChat.countDocuments(),
      Reporte.countDocuments(),
      Usuario.aggregate([{ $group: { _id: '$rol', total: { $sum: 1 } } }]),
      Reporte.aggregate([{ $group: { _id: '$estado', total: { $sum: 1 } } }]),
      Resena.aggregate([{ $group: { _id: null, promedio: { $avg: '$calificacion' } } }]),
      Pelicula.countDocuments({ totalResenas: 0 }),
      Resena.aggregate([
        { $match: { createdAt: { $gte: desde } } },
        { $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            total: { $sum: 1 }
        } }
      ])
    ]);

    // Reportes por estado (con 0 si no hay)
    const reportesPorEstado = Object.fromEntries(ESTADOS_REPORTE.map(e => [e, 0]));
    for (const r of porEstado) reportesPorEstado[r._id] = r.total;

    const usuariosPorRol = { usuario: 0, admin: 0 };
    for (const r of porRol) usuariosPorRol[r._id] = r.total;

    // Los 6 meses completos, con 0 en los que no tuvieron reseñas
    const mapaMeses = new Map(porMes.map(m => [m._id, m.total]));
    const resenasPorMes = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(desde);
      d.setMonth(desde.getMonth() + i);
      const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      resenasPorMes.push({ mes, total: mapaMeses.get(mes) || 0 });
    }

    res.json({
      totales: { usuarios, peliculas, resenas, comentarios, foros, mensajesForo, amistades, conversaciones, mensajesChat, reportes },
      usuariosPorRol,
      reportesPorEstado,
      promedioGlobal: promedio.length ? Math.round(promedio[0].promedio * 100) / 100 : 0,
      peliculasSinResenas: sinResenas,
      resenasPorMes
    });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ---------------------------------------------------------------------
// Consulta 1: películas mejor calificadas
//   ?limite=10 (1 a 50)   ?minResenas=1 (mínimo de reseñas para entrar al ranking)
// ---------------------------------------------------------------------
router.get('/peliculas-top', requireAdmin, async (req, res) => {
  try {
    const limite = entero(req.query.limite, 10, 1, 50);
    const minResenas = entero(req.query.minResenas, 1, 0, 1000);
    if (limite === null || minResenas === null) {
      return res.status(400).json({ error: 'Parámetros inválidos' });
    }

    const peliculas = await Pelicula.aggregate([
      { $match: { totalResenas: { $gte: minResenas } } },
      { $sort: { promedioCalificacion: -1, totalResenas: -1, titulo: 1 } },
      { $limit: limite },
      { $lookup: { from: col(Resena), localField: '_id', foreignField: 'pelicula', as: 'resenas' } },
      { $lookup: { from: col(Foro), localField: '_id', foreignField: 'pelicula', as: 'foros' } },
      { $lookup: { from: col(Comentario), localField: 'resenas._id', foreignField: 'resena', as: 'comentarios' } },
      { $project: {
          titulo: 1,
          anio: 1,
          genero: 1,
          promedio: '$promedioCalificacion',
          totalResenas: { $size: '$resenas' },
          totalComentarios: { $size: '$comentarios' },
          totalForos: { $size: '$foros' },
          totalLikes: sumaLikes('$resenas')
      } }
    ]);

    res.json(peliculas);
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ---------------------------------------------------------------------
// Consulta 2: usuarios más activos
//   ?limite=10 (1 a 50)
// ---------------------------------------------------------------------
router.get('/usuarios-activos', requireAdmin, async (req, res) => {
  try {
    const limite = entero(req.query.limite, 10, 1, 50);
    if (limite === null) return res.status(400).json({ error: 'Parámetros inválidos' });

    const usuarios = await Usuario.aggregate([
      { $lookup: { from: col(Resena), localField: '_id', foreignField: 'usuario', as: 'resenas' } },
      { $lookup: { from: col(Comentario), localField: '_id', foreignField: 'usuario', as: 'comentarios' } },
      { $lookup: { from: col(MensajeForo), localField: '_id', foreignField: 'usuario', as: 'mensajesForo' } },
      { $lookup: { from: col(Foro), localField: '_id', foreignField: 'creadoPor', as: 'foros' } },
      { $project: {
          username: 1,
          rol: 1,
          totalResenas: { $size: '$resenas' },
          totalComentarios: { $size: '$comentarios' },
          totalMensajesForo: { $size: '$mensajesForo' },
          totalForos: { $size: '$foros' },
          likesRecibidos: sumaLikes('$resenas'),
          // Indicador de actividad: todo lo que ha publicado
          actividad: { $add: [
            { $size: '$resenas' }, { $size: '$comentarios' },
            { $size: '$mensajesForo' }, { $size: '$foros' }
          ] }
      } },
      { $sort: { actividad: -1, username: 1 } },
      { $limit: limite }
    ]);

    res.json(usuarios);
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ---------------------------------------------------------------------
// Consulta 3: contenido más reportado (con su autor y estado de moderación)
//   ?limite=10 (1 a 50)   ?estado=pendiente|revisado|eliminado (filtra los reportes)
// ---------------------------------------------------------------------
router.get('/contenido-reportado', requireAdmin, async (req, res) => {
  try {
    const limite = entero(req.query.limite, 10, 1, 50);
    if (limite === null) return res.status(400).json({ error: 'Parámetros inválidos' });

    const filtro = {};
    if (req.query.estado) {
      if (!ESTADOS_REPORTE.includes(req.query.estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      filtro.estado = req.query.estado;
    }

    const filas = await Reporte.aggregate([
      { $match: filtro },
      { $group: {
          _id: { tipo: '$tipo', contenido: '$contenido' },
          totalReportes: { $sum: 1 },
          pendientes: { $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] } },
          eliminados: { $sum: { $cond: [{ $eq: ['$estado', 'eliminado'] }, 1, 0] } },
          ultimoReporte: { $max: '$createdAt' },
          motivos: { $push: '$razon' }
      } },
      { $sort: { pendientes: -1, totalReportes: -1, ultimoReporte: -1 } },
      { $limit: limite },
      // El contenido puede estar en una de tres colecciones según su tipo
      { $lookup: { from: col(Resena), localField: '_id.contenido', foreignField: '_id', as: 'r' } },
      { $lookup: { from: col(Comentario), localField: '_id.contenido', foreignField: '_id', as: 'c' } },
      { $lookup: { from: col(MensajeForo), localField: '_id.contenido', foreignField: '_id', as: 'm' } },
      { $addFields: { doc: { $arrayElemAt: [{ $concatArrays: ['$r', '$c', '$m'] }, 0] } } },
      { $lookup: { from: col(Usuario), localField: 'doc.usuario', foreignField: '_id', as: 'autor' } },
      { $project: {
          tipo: '$_id.tipo',
          contenidoId: '$_id.contenido',
          totalReportes: 1,
          pendientes: 1,
          eliminados: 1,
          ultimoReporte: 1,
          motivos: { $slice: ['$motivos', 5] },
          titulo: '$doc.titulo',
          texto: '$doc.texto',
          autor: { $arrayElemAt: ['$autor.username', 0] }
      } }
    ]);

    res.json(filas.map(f => ({
      tipo: f.tipo,
      contenidoId: f.contenidoId,
      totalReportes: f.totalReportes,
      pendientes: f.pendientes,
      // Resumen del estado de moderación de ese contenido
      estado: f.pendientes > 0 ? 'pendiente' : (f.eliminados > 0 ? 'eliminado' : 'revisado'),
      ultimoReporte: f.ultimoReporte,
      motivos: f.motivos,
      titulo: f.titulo || null,
      texto: f.texto ? String(f.texto).slice(0, 120) : null, // null si el contenido ya fue eliminado
      autor: f.autor || null
    })));
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// ---------------------------------------------------------------------
// Consulta 4: actividad por género
// ---------------------------------------------------------------------
router.get('/generos', requireAdmin, async (req, res) => {
  try {
    const generos = await Pelicula.aggregate([
      { $lookup: { from: col(Resena), localField: '_id', foreignField: 'pelicula', as: 'resenas' } },
      { $lookup: { from: col(Foro), localField: '_id', foreignField: 'pelicula', as: 'foros' } },
      { $lookup: { from: col(MensajeForo), localField: 'foros._id', foreignField: 'foro', as: 'mensajes' } },
      { $addFields: {
          nResenas: { $size: '$resenas' },
          nForos: { $size: '$foros' },
          nMensajes: { $size: '$mensajes' },
          sumaCalificaciones: { $sum: '$resenas.calificacion' }
      } },
      { $group: {
          _id: '$genero',
          peliculas: { $sum: 1 },
          resenas: { $sum: '$nResenas' },
          foros: { $sum: '$nForos' },
          mensajesForo: { $sum: '$nMensajes' },
          sumaCalificaciones: { $sum: '$sumaCalificaciones' }
      } },
      { $project: {
          _id: 0,
          genero: '$_id',
          peliculas: 1,
          resenas: 1,
          foros: 1,
          mensajesForo: 1,
          promedio: { $cond: [
            { $gt: ['$resenas', 0] },
            { $round: [{ $divide: ['$sumaCalificaciones', '$resenas'] }, 2] },
            0
          ] }
      } },
      { $sort: { resenas: -1, peliculas: -1, genero: 1 } }
    ]);

    res.json(generos);
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
