const express = require('express');
const mongoose = require('mongoose');
const { Pelicula } = require('../models');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// GET /api/peliculas   (todas con filtros)
router.get('/', async (req, res) => {
  try {
    const filtro = {};

    if (req.query.genero && req.query.genero !== 'Todos') {
      filtro.genero = req.query.genero;
    }
    if (req.query.q) {
      // $options: 'i' = ignora mayúsculas/minúsculas
      filtro.titulo = { $regex: req.query.q.trim(), $options: 'i' };
    }

    const peliculas = await Pelicula.find(filtro).sort({ createdAt: -1 });
    res.json(peliculas);
  } catch (err) {
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/peliculas (requiere sesión)
router.post('/', requireLogin, async (req, res) => {
  try {
    // creadoPor se saca de la sesión
    const { titulo, anio, director, genero, sinopsis, poster } = req.body;

    if (!titulo || !anio || !director || !genero) {
      return res.status(400).json({ error: 'Faltan datos' });
    }
    if (anio < 1888 || anio > new Date().getFullYear() + 1) {
      return res.status(400).json({ error: 'El año es incorrecto' });
    }

    const nueva = await Pelicula.create({
      titulo, anio, director, genero, sinopsis, poster,
      creadoPor: req.session.userId
    });

    res.status(201).json(nueva);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;