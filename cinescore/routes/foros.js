const express = require('express');
const mongoose = require('mongoose');
const { Foro, MensajeForo, Pelicula } = require('../models');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// GET /api/foros (todos los foros)
// GET /api/foros   (foros de una película)
router.get('/', async (req, res) => {
  try {
    const { pelicula } = req.query;
    const filtro = {};
    let peli = null;

    if (pelicula) {
      if (!mongoose.isValidObjectId(pelicula)) {
        return res.status(400).json({ error: 'Película inválida' });
      }
      peli = await Pelicula.findById(pelicula).select('titulo anio');
      if (!peli) return res.status(404).json({ error: 'Película no encontrada' });
      filtro.pelicula = pelicula;
    }

    const foros = await Foro.find(filtro)
      .populate('creadoPor', 'username')
      .populate('pelicula', 'titulo anio')
      .sort({ createdAt: -1 });

    // Cuántas respuestas tiene cada foro
    const conteos = await MensajeForo.aggregate([
      { $match: { foro: { $in: foros.map(f => f._id) } } },
      { $group: { _id: '$foro', total: { $sum: 1 } } }
    ]);
    const totales = new Map(conteos.map(c => [c._id.toString(), c.total]));

    res.json({
      pelicula: peli,
      foros: foros.map(f => ({
        _id: f._id,
        titulo: f.titulo,
        createdAt: f.createdAt,
        creadoPor: f.creadoPor,
        pelicula: f.pelicula,
        respuestas: totales.get(f._id.toString()) || 0
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/foros/:id   (el foro y sus mensajes)
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const foro = await Foro.findById(req.params.id)
      .populate('creadoPor', 'username avatar')
      .populate('pelicula', 'titulo anio');
    if (!foro) return res.status(404).json({ error: 'Foro no encontrado' });

    const mensajes = await MensajeForo.find({ foro: foro._id })
      .populate('usuario', 'username avatar')
      .sort({ createdAt: 1 });

    const yo = req.session.userId;
    res.json({
      foro: {
        _id: foro._id,
        titulo: foro.titulo,
        descripcion: foro.descripcion,
        createdAt: foro.createdAt,
        creadoPor: foro.creadoPor,
        pelicula: foro.pelicula
      },
      mensajes: mensajes.map(m => ({
        _id: m._id,
        texto: m.texto,
        createdAt: m.createdAt,
        usuario: m.usuario,
        likes: m.likes.length,
        yoLeDiLike: !!yo && m.likes.some(u => u.toString() === yo)
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/foros  
router.post('/', requireLogin, async (req, res) => {
  try {
    const { pelicula, titulo, descripcion } = req.body;

    if (!mongoose.isValidObjectId(pelicula)) {
      return res.status(400).json({ error: 'Película inválida' });
    }
    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ error: 'Falta el título del foro' });
    }
    if (titulo.length > 150) {
      return res.status(400).json({ error: 'El título es muy largo (máximo 150 caracteres)' });
    }
    if ((descripcion || '').length > 2000) {
      return res.status(400).json({ error: 'El mensaje inicial es muy largo (máximo 2000 caracteres)' });
    }
    if (!(await Pelicula.exists({ _id: pelicula }))) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    const foro = await Foro.create({
      pelicula,
      titulo: titulo.trim(),
      descripcion: (descripcion || '').trim(),
      creadoPor: req.session.userId
    });

    res.status(201).json(foro);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/foros/:id/mensajes 
router.post('/:id/mensajes', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }
    const { texto } = req.body;

    if (!texto || !texto.trim()) {
      return res.status(400).json({ error: 'El mensaje está vacío' });
    }
    if (texto.length > 1000) {
      return res.status(400).json({ error: 'El mensaje es muy largo (máximo 1000 caracteres)' });
    }
    if (!(await Foro.exists({ _id: req.params.id }))) {
      return res.status(404).json({ error: 'Foro no encontrado' });
    }

    const nuevo = await MensajeForo.create({
      foro: req.params.id,
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

// POST /api/foros/mensajes/:id/like   (da o quita like a un mensaje)
router.post('/mensajes/:id/like', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }
    const mensaje = await MensajeForo.findById(req.params.id);
    if (!mensaje) return res.status(404).json({ error: 'Mensaje no encontrado' });

    const yo = req.session.userId;
    const yaLeDio = mensaje.likes.some(u => u.toString() === yo);

    if (yaLeDio) mensaje.likes.pull(yo);
    else mensaje.likes.push(yo);
    await mensaje.save();

    res.json({ liked: !yaLeDio, likes: mensaje.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;