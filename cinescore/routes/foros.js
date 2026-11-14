const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { Foro, MensajeForo, Pelicula } = require('../models');
const { requireLogin } = require('../middleware/auth');
const { puedeModificar, usuarioActual } = require('../utils/permisos');
const { validarForo, validarMensajeForo } = require('../utils/validaciones');
const { borrarForos, borrarMensajesForo } = require('../utils/cascada');

const router = express.Router();

// GET /api/foros   
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
    logger.error(`${req.method} ${req.originalUrl}`, err);
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
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/foros
router.post('/', requireLogin, async (req, res) => {
  try {
    const { pelicula } = req.body;

    if (!mongoose.isValidObjectId(pelicula)) {
      return res.status(400).json({ error: 'Película inválida' });
    }
    const { error, datos } = validarForo(req.body);
    if (error) return res.status(400).json({ error });

    if (!(await Pelicula.exists({ _id: pelicula }))) {
      return res.status(404).json({ error: 'Película no encontrada' });
    }

    const foro = await Foro.create({
      ...datos,
      pelicula,
      creadoPor: usuarioActual(req).id
    });

    logger.info('Foro creado', { foroId: foro._id.toString(), peliculaId: pelicula });
    res.status(201).json(foro);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/foros/:id  (solo quien lo creó o un admin)
router.put('/:id', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const foro = await Foro.findById(req.params.id);
    if (!foro) return res.status(404).json({ error: 'Foro no encontrado' });

    if (!puedeModificar(req, foro.creadoPor)) {
      logger.warn('Intento de editar foro ajeno', { foroId: req.params.id, por: usuarioActual(req).id });
      return res.status(403).json({ error: 'No puedes editar este foro' });
    }

    const { error, datos } = validarForo(req.body);
    if (error) return res.status(400).json({ error });

    foro.set(datos);
    await foro.save();

    logger.info('Foro actualizado', { foroId: req.params.id, por: usuarioActual(req).id });
    res.json(foro);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/foros/:id  (solo quien lo creó o un admin)
// También borra sus mensajes y los reportes que apuntaban a ellos.
router.delete('/:id', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const foro = await Foro.findById(req.params.id);
    if (!foro) return res.status(404).json({ error: 'Foro no encontrado' });

    if (!puedeModificar(req, foro.creadoPor)) {
      logger.warn('Intento de borrar foro ajeno', { foroId: req.params.id, por: usuarioActual(req).id });
      return res.status(403).json({ error: 'No puedes eliminar este foro' });
    }

    await borrarForos({ _id: foro._id });

    logger.info('Foro eliminado (con sus mensajes)', { foroId: req.params.id, por: usuarioActual(req).id });
    res.json({ mensaje: 'Foro eliminado' });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/foros/:id/mensajes
router.post('/:id/mensajes', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }
    const { error, datos } = validarMensajeForo(req.body);
    if (error) return res.status(400).json({ error });

    if (!(await Foro.exists({ _id: req.params.id }))) {
      return res.status(404).json({ error: 'Foro no encontrado' });
    }

    const nuevo = await MensajeForo.create({
      ...datos,
      foro: req.params.id,
      usuario: usuarioActual(req).id
    });

    logger.info('Mensaje de foro creado', { mensajeId: nuevo._id.toString(), foroId: req.params.id });
    res.status(201).json(nuevo);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/foros/mensajes/:id  (un solo mensaje)
router.get('/mensajes/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const m = await MensajeForo.findById(req.params.id).populate('usuario', 'username avatar');
    if (!m) return res.status(404).json({ error: 'Mensaje no encontrado' });

    const yo = req.session.userId;
    res.json({
      _id: m._id,
      foro: m.foro,
      texto: m.texto,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      usuario: m.usuario,
      likes: m.likes.length,
      yoLeDiLike: !!yo && m.likes.some(u => u.toString() === yo)
    });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/foros/mensajes/:id  (solo su autor o un admin)
router.put('/mensajes/:id', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const mensaje = await MensajeForo.findById(req.params.id);
    if (!mensaje) return res.status(404).json({ error: 'Mensaje no encontrado' });

    if (!puedeModificar(req, mensaje.usuario)) {
      logger.warn('Intento de editar mensaje de foro ajeno', { mensajeId: req.params.id, por: usuarioActual(req).id });
      return res.status(403).json({ error: 'No puedes editar este mensaje' });
    }

    const { error, datos } = validarMensajeForo(req.body);
    if (error) return res.status(400).json({ error });

    mensaje.set(datos);
    await mensaje.save();

    logger.info('Mensaje de foro actualizado', { mensajeId: req.params.id, por: usuarioActual(req).id });
    res.json(mensaje);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/foros/mensajes/:id  (solo su autor o un admin)
router.delete('/mensajes/:id', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const mensaje = await MensajeForo.findById(req.params.id);
    if (!mensaje) return res.status(404).json({ error: 'Mensaje no encontrado' });

    if (!puedeModificar(req, mensaje.usuario)) {
      logger.warn('Intento de borrar mensaje de foro ajeno', { mensajeId: req.params.id, por: usuarioActual(req).id });
      return res.status(403).json({ error: 'No puedes eliminar este mensaje' });
    }

    await borrarMensajesForo({ _id: mensaje._id });

    logger.info('Mensaje de foro eliminado', { mensajeId: req.params.id, por: usuarioActual(req).id });
    res.json({ mensaje: 'Mensaje eliminado' });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
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
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;