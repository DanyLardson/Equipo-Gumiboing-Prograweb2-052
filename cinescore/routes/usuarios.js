const express = require('express');
const mongoose = require('mongoose');
const { Usuario, Resena, Comentario } = require('../models');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// GET /api/usuarios/me  (datos del perfil, estadísticas y reseñas recientes)
router.get('/me', requireLogin, async (req, res) => {
  try {
    const id = req.session.userId;

    const usuario = await Usuario.findById(id).select('-password');
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });

    const [totalResenas, totalComentarios, recientes, likesAgg] = await Promise.all([
      Resena.countDocuments({ usuario: id }),
      Comentario.countDocuments({ usuario: id }),
      Resena.find({ usuario: id })
        .populate('pelicula', 'titulo poster')
        .sort({ createdAt: -1 })
        .limit(10),
      // Suma de likes que han recibido sus reseñas
      Resena.aggregate([
        { $match: { usuario: new mongoose.Types.ObjectId(id) } },
        { $project: { n: { $size: '$likes' } } },
        { $group: { _id: null, total: { $sum: '$n' } } }
      ])
    ]);

    res.json({
      usuario,
      stats: {
        resenas: totalResenas,
        comentarios: totalComentarios,
        likes: likesAgg.length ? likesAgg[0].total : 0
      },
      recientes: recientes.map(r => ({
        _id: r._id,
        titulo: r.titulo,
        calificacion: r.calificacion,
        createdAt: r.createdAt,
        pelicula: r.pelicula // puede ser null si la película se borró
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/usuarios/me  (editar perfil)
router.put('/me', requireLogin, async (req, res) => {
  try {
    // Solo se permiten estos dos campos 
    const { bio, avatar } = req.body;

    const usuario = await Usuario.findByIdAndUpdate(
      req.session.userId,
      { bio: (bio || '').trim(), avatar: (avatar || '').trim() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;