const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { Comentario, Resena } = require('../models');
const { requireLogin } = require('../middleware/auth');
const { puedeModificar, usuarioActual } = require('../utils/permisos');
const { validarComentario } = require('../utils/validaciones');
const { borrarComentarios } = require('../utils/cascada');

const router = express.Router();

// Convierte un comentario de la BD en lo que verá el front end
function formatear(c, yo) {
  return {
    _id: c._id,
    texto: c.texto,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    usuario: c.usuario,
    likes: c.likes.length,
    yoLeDiLike: !!yo && c.likes.some(u => u.toString() === yo)
  };
}

// GET /api/comentarios?resena=ID  los comentarios de una reseña
router.get('/', async (req, res) => {
  try {
    const { resena } = req.query;
    if (!mongoose.isValidObjectId(resena)) {
      return res.status(400).json({ error: 'Reseña inválida' });
    }

    const comentarios = await Comentario.find({ resena })
      .populate('usuario', 'username avatar')
      .sort({ createdAt: 1 }); // los más viejos primero

    res.json(comentarios.map(c => formatear(c, req.user.id)));
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/comentarios/:id  uno solo
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const c = await Comentario.findById(req.params.id).populate('usuario', 'username avatar');
    if (!c) return res.status(404).json({ error: 'Comentario no encontrado' });

    res.json({ ...formatear(c, req.user.id), resena: c.resena });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/comentarios
router.post('/', requireLogin, async (req, res) => {
  try {
    const { resena } = req.body;

    if (!mongoose.isValidObjectId(resena)) {
      return res.status(400).json({ error: 'Reseña inválida' });
    }
    const { error, datos } = validarComentario(req.body);
    if (error) return res.status(400).json({ error });

    if (!(await Resena.exists({ _id: resena }))) {
      return res.status(404).json({ error: 'Reseña no encontrada' });
    }

    const nuevo = await Comentario.create({
      ...datos,
      resena,
      usuario: usuarioActual(req).id
    });

    logger.info('Comentario creado', { comentarioId: nuevo._id.toString(), resenaId: resena });
    res.status(201).json(nuevo);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/comentarios/:id  solo su autor o un admin
router.put('/:id', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado' });

    if (!puedeModificar(req, comentario.usuario)) {
      logger.warn('Intento de editar comentario ajeno', { comentarioId: req.params.id, por: usuarioActual(req).id });
      return res.status(403).json({ error: 'No puedes editar este comentario' });
    }

    const { error, datos } = validarComentario(req.body);
    if (error) return res.status(400).json({ error });

    comentario.set(datos);
    await comentario.save();

    logger.info('Comentario actualizado', { comentarioId: req.params.id, por: usuarioActual(req).id });
    res.json(comentario);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/comentarios/:id  solo su autor o un admin
router.delete('/:id', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado' });

    if (!puedeModificar(req, comentario.usuario)) {
      logger.warn('Intento de borrar comentario ajeno', { comentarioId: req.params.id, por: usuarioActual(req).id });
      return res.status(403).json({ error: 'No puedes eliminar este comentario' });
    }

    await borrarComentarios({ _id: comentario._id });

    logger.info('Comentario eliminado', { comentarioId: req.params.id, por: usuarioActual(req).id });
    res.json({ mensaje: 'Comentario eliminado' });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/comentarios/:id/like  da o quita like
router.post('/:id/like', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }
    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) return res.status(404).json({ error: 'Comentario no encontrado' });

    const yo = req.user.id;
    const yaLeDio = comentario.likes.some(u => u.toString() === yo);

    if (yaLeDio) comentario.likes.pull(yo);
    else comentario.likes.push(yo);
    await comentario.save();

    res.json({ liked: !yaLeDio, likes: comentario.likes.length });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
