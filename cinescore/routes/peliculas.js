const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { Pelicula } = require('../models');
const { requireLogin } = require('../middleware/auth');
const { puedeModificar, usuarioActual } = require('../utils/permisos');
const { validarPelicula } = require('../utils/validaciones');
const { borrarPelicula } = require('../utils/cascada');

const router = express.Router();

function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/peliculas   (todas con filtros)
router.get('/', async (req, res) => {
  try {
    const filtro = {};

    if (req.query.genero && req.query.genero !== 'Todos') {
      filtro.genero = String(req.query.genero);
    }
    if (req.query.q) {
      // $options: 'i' = ignora mayúsculas/minúsculas
      filtro.titulo = { $regex: escaparRegex(String(req.query.q).trim()), $options: 'i' };
    }

    const peliculas = await Pelicula.find(filtro).sort({ createdAt: -1 });
    res.json(peliculas);
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/peliculas/:id  (Solo una)
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const peli = await Pelicula.findById(req.params.id);
    if (!peli) return res.status(404).json({ error: 'Película no encontrada' });

    res.json(peli);
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/peliculas (requiere sesión)
router.post('/', requireLogin, async (req, res) => {
  try {
    const { error, datos } = validarPelicula(req.body);
    if (error) return res.status(400).json({ error });

    // creadoPor se saca de la sesión
    const nueva = await Pelicula.create({ ...datos, creadoPor: usuarioActual(req).id });

    logger.info('Película creada', { peliculaId: nueva._id.toString(), por: usuarioActual(req).id });
    res.status(201).json(nueva);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/peliculas/:id  (solo quien la creó o un admin)
router.put('/:id', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const peli = await Pelicula.findById(req.params.id);
    if (!peli) return res.status(404).json({ error: 'Película no encontrada' });

    if (!puedeModificar(req, peli.creadoPor)) {
      logger.warn('Intento de editar película ajena', { peliculaId: req.params.id, por: usuarioActual(req).id });
      return res.status(403).json({ error: 'No puedes editar esta película' });
    }

    const { error, datos } = validarPelicula(req.body);
    if (error) return res.status(400).json({ error });

    peli.set(datos);
    await peli.save();

    logger.info('Película actualizada', { peliculaId: req.params.id, por: usuarioActual(req).id });
    res.json(peli);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/peliculas/:id  (solo quien la creó o un admin)
// También borra sus reseñas, comentarios, foros y reportes relacionados.
router.delete('/:id', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const peli = await Pelicula.findById(req.params.id);
    if (!peli) return res.status(404).json({ error: 'Película no encontrada' });

    if (!puedeModificar(req, peli.creadoPor)) {
      logger.warn('Intento de borrar película ajena', { peliculaId: req.params.id, por: usuarioActual(req).id });
      return res.status(403).json({ error: 'No puedes eliminar esta película' });
    }

    logger.info('Eliminando película', { peliculaId: req.params.id, por: usuarioActual(req).id });
    await borrarPelicula(peli._id);

    res.json({ mensaje: 'Película eliminada' });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
