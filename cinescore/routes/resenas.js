const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { Resena, Pelicula, Comentario } = require('../models');
const { requireLogin } = require('../middleware/auth');
const { puedeModificar, usuarioActual } = require('../utils/permisos');
const { validarResena } = require('../utils/validaciones');
const { borrarResenas } = require('../utils/cascada');

const router = express.Router();

// recalcula promedio y total de reseñas de una película
async function recalcular(peliculaId) {
  logger.info('Recalculando promedio de película', { peliculaId: String(peliculaId) });
  const [r] = await Resena.aggregate([
    { $match: { pelicula: new mongoose.Types.ObjectId(peliculaId) } },
    { $group: { _id: '$pelicula', promedio: { $avg: '$calificacion' }, total: { $sum: 1 } } }
  ]);
  await Pelicula.findByIdAndUpdate(peliculaId, {
    promedioCalificacion: r ? Math.round(r.promedio * 10) / 10 : 0,
    totalResenas: r ? r.total : 0
  });
}

// GET /api/resenas?pelicula=ID  las reseñas de una película
router.get('/', async (req, res) => {
  try {
    const { pelicula } = req.query;
    if (!mongoose.isValidObjectId(pelicula)) {
      return res.status(400).json({ error: 'Película inválida' });
    }

    const resenas = await Resena.find({ pelicula })
      .populate('usuario', 'username avatar')
      .sort({ createdAt: -1 });

    // cuántos comentarios tiene cada reseña
    const conteos = await Comentario.aggregate([
      { $match: { resena: { $in: resenas.map(r => r._id) } } },
      { $group: { _id: '$resena', total: { $sum: 1 } } }
    ]);
    const totales = new Map(conteos.map(c => [c._id.toString(), c.total]));

    const yo = req.user.id;
    res.json(resenas.map(r => ({
      _id: r._id,
      titulo: r.titulo,
      texto: r.texto,
      calificacion: r.calificacion,
      createdAt: r.createdAt,
      usuario: r.usuario,
      comentarios: totales.get(r._id.toString()) || 0,
      likes: r.likes.length,
      yoLeDiLike: !!yo && r.likes.some(u => u.toString() === yo)
    })));
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/resenas/:id  una sola reseña
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const r = await Resena.findById(req.params.id)
      .populate('usuario', 'username avatar')
      .populate('pelicula', 'titulo anio');
    if (!r) return res.status(404).json({ error: 'Reseña no encontrada' });

    const yo = req.user.id;
    res.json({
      _id: r._id,
      titulo: r.titulo,
      texto: r.texto,
      calificacion: r.calificacion,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      usuario: r.usuario,
      pelicula: r.pelicula,
      likes: r.likes.length,
      yoLeDiLike: !!yo && r.likes.some(u => u.toString() === yo)
    });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/resenas  se necesita login
router.post('/', requireLogin, async (req, res) => {
  try {
    const { pelicula } = req.body;

    if (!mongoose.isValidObjectId(pelicula)) {
      return res.status(400).json({ error: 'Película inválida' });
    }
    const { error, datos } = validarResena(req.body);
    if (error) return res.status(400).json({ error });

    if (!(await Pelicula.exists({ _id: pelicula }))) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    const nueva = await Resena.create({
      ...datos,
      pelicula,
      usuario: usuarioActual(req).id
    });

    await recalcular(pelicula);
    logger.info('Reseña creada', { resenaId: nueva._id.toString(), peliculaId: pelicula });
    res.status(201).json(nueva);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Ya escribiste una reseña de esta película' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/resenas/:id  solo su autor o un admin
router.put('/:id', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const resena = await Resena.findById(req.params.id);
    if (!resena) return res.status(404).json({ error: 'Reseña no encontrada' });

    if (!puedeModificar(req, resena.usuario)) {
      logger.warn('Intento de editar reseña ajena', { resenaId: req.params.id, por: usuarioActual(req).id });
      return res.status(403).json({ error: 'No puedes editar esta reseña' });
    }

    const { error, datos } = validarResena(req.body);
    if (error) return res.status(400).json({ error });

    resena.set(datos);
    await resena.save();
    await recalcular(resena.pelicula);

    logger.info('Reseña actualizada', { resenaId: req.params.id, por: usuarioActual(req).id });
    res.json(resena);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/resenas/:id  solo su autor o un admin
router.delete('/:id', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const resena = await Resena.findById(req.params.id);
    if (!resena) return res.status(404).json({ error: 'Reseña no encontrada' });

    if (!puedeModificar(req, resena.usuario)) {
      logger.warn('Intento de borrar reseña ajena', { resenaId: req.params.id, por: usuarioActual(req).id });
      return res.status(403).json({ error: 'No puedes eliminar esta reseña' });
    }

    const peliculaId = resena.pelicula;
    await borrarResenas({ _id: resena._id });
    await recalcular(peliculaId);

    logger.info('Reseña eliminada', { resenaId: req.params.id, por: usuarioActual(req).id });
    res.json({ mensaje: 'Reseña eliminada' });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/resenas/:id/like  da o quita like
router.post('/:id/like', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }
    const resena = await Resena.findById(req.params.id);
    if (!resena) return res.status(404).json({ error: 'Reseña no encontrada' });

    const yo = req.user.id;
    const yaLeDio = resena.likes.some(u => u.toString() === yo);

    if (yaLeDio) resena.likes.pull(yo);
    else resena.likes.push(yo);
    await resena.save();

    res.json({ liked: !yaLeDio, likes: resena.likes.length });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
module.exports.recalcular = recalcular;
