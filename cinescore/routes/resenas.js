const express = require('express');
const mongoose = require('mongoose');
const { Resena, Pelicula } = require('../models');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// Recalcula promedio y total de reseñas de una película
async function recalcular(peliculaId) {
  const [r] = await Resena.aggregate([
    { $match: { pelicula: new mongoose.Types.ObjectId(peliculaId) } },
    { $group: { _id: '$pelicula', promedio: { $avg: '$calificacion' }, total: { $sum: 1 } } }
  ]);
  await Pelicula.findByIdAndUpdate(peliculaId, {
    promedioCalificacion: r ? Math.round(r.promedio * 10) / 10 : 0,
    totalResenas: r ? r.total : 0
  });
}

// GET /api/resenas acui por ID
router.get('/', async (req, res) => {
  try {
    const { pelicula } = req.query;
    if (!mongoose.isValidObjectId(pelicula)) {
      return res.status(400).json({ error: 'Película inválida' });
    }

    const resenas = await Resena.find({ pelicula })
      .populate('usuario', 'username avatar')
      .sort({ createdAt: -1 });

    const yo = req.session.userId;
    res.json(resenas.map(r => ({
      _id: r._id,
      titulo: r.titulo,
      texto: r.texto,
      calificacion: r.calificacion,
      createdAt: r.createdAt,
      usuario: r.usuario,
      likes: r.likes.length,
      yoLeDiLike: !!yo && r.likes.some(u => u.toString() === yo)
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/resenas  (se necesita login)
router.post('/', requireLogin, async (req, res) => {
  try {
    const { pelicula, calificacion, titulo, texto } = req.body;

    if (!mongoose.isValidObjectId(pelicula)) {
      return res.status(400).json({ error: 'Película inválida' });
    }
    if (!calificacion || !titulo || !texto) {
      return res.status(400).json({ error: 'Faltan datos' });
    }
    if (!(await Pelicula.exists({ _id: pelicula }))) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    const nueva = await Resena.create({
      pelicula, calificacion, titulo, texto,
      usuario: req.session.userId
    });

    await recalcular(pelicula);
    res.status(201).json(nueva);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Ya escribiste una reseña de esta película' });
    }
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/resenas/:id/like  -> da o quita like
router.post('/:id/like', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }
    const resena = await Resena.findById(req.params.id);
    if (!resena) return res.status(404).json({ error: 'Reseña no encontrada' });

    const yo = req.session.userId;
    const yaLeDio = resena.likes.some(u => u.toString() === yo);

    if (yaLeDio) resena.likes.pull(yo);
    else resena.likes.push(yo);
    await resena.save();

    res.json({ liked: !yaLeDio, likes: resena.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
module.exports.recalcular = recalcular;