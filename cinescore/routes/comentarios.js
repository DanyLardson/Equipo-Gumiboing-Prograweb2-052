const express = require('express');
const mongoose = require('mongoose');
const { Comentario, Resena } = require('../models');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// Convierte un comentario de la BD en lo que verá el front end
function formatear(c, yo) {
  return {
    _id: c._id,
    texto: c.texto,
    createdAt: c.createdAt,
    usuario: c.usuario,
    likes: c.likes.length,
    yoLeDiLike: !!yo && c.likes.some(u => u.toString() === yo)
  };
}

// GET /api/comentarios
router.get('/', async (req, res) => {
  try {
    const { resena } = req.query;
    if (!mongoose.isValidObjectId(resena)) {
      return res.status(400).json({ error: 'Reseña inválida' });
    }

    const comentarios = await Comentario.find({ resena })
      .populate('usuario', 'username avatar')
      .sort({ createdAt: 1 }); // los más viejos primero

    res.json(comentarios.map(c => formatear(c, req.session.userId)));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/comentarios 
router.post('/', requireLogin, async (req, res) => {
  try {
    const { resena, texto } = req.body;

    if (!mongoose.isValidObjectId(resena)) {
      return res.status(400).json({ error: 'Reseña inválida' });
    }
    if (!texto || !texto.trim()) {
      return res.status(400).json({ error: 'El comentario está vacío' });
    }
    if (texto.length > 500) {
      return res.status(400).json({ error: 'El comentario es muy largo (máximo 500 caracteres)' });
    }
    if (!(await Resena.exists({ _id: resena }))) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    const nuevo = await Comentario.create({
      resena,
      texto: texto.trim(),
      usuario: req.session.userId
    });

    res.status(201).json(nuevo);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/comentarios/:id/like  -> da o quita like
router.post('/:id/like', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }
    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado' });

    const yo = req.session.userId;
    const yaLeDio = comentario.likes.some(u => u.toString() === yo);

    if (yaLeDio) comentario.likes.pull(yo);
    else comentario.likes.push(yo);
    await comentario.save();

    res.json({ liked: !yaLeDio, likes: comentario.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;