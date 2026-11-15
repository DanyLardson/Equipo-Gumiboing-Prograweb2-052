const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { Conversacion, MensajeChat, Amistad } = require('../models');
const { requireLogin } = require('../middleware/auth');
const { validarMensajeChat } = require('../utils/validaciones');

const router = express.Router();

// ¿Son amigos (solicitud aceptada en cualquier dirección)?
async function sonAmigos(a, b) {
  return !!(await Amistad.exists({
    estado: 'aceptada',
    $or: [
      { solicitante: a, destinatario: b },
      { solicitante: b, destinatario: a }
    ]
  }));
}

// Devuelve la conversación solo si el usuario participa en ella
async function conversacionDe(id, yo) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Conversacion.findOne({ _id: id, participantes: yo })
    .populate('participantes', 'username avatar');
}

// GET /api/chat -> mis conversaciones, con el otro usuario, el último mensaje y los no leídos
router.get('/', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;
    const conversaciones = await Conversacion.find({ participantes: yo })
      .populate('participantes', 'username avatar')
      .sort({ updatedAt: -1 });
    const ids = conversaciones.map(c => c._id);

    const [ultimos, noLeidos] = await Promise.all([
      MensajeChat.aggregate([
        { $match: { conversacion: { $in: ids } } },
        { $sort: { createdAt: -1 } },
        { $group: {
            _id: '$conversacion',
            texto: { $first: '$texto' },
            createdAt: { $first: '$createdAt' },
            emisor: { $first: '$emisor' }
        } }
      ]),
      MensajeChat.aggregate([
        { $match: {
            conversacion: { $in: ids },
            emisor: { $ne: new mongoose.Types.ObjectId(yo) },
            leido: false
        } },
        { $group: { _id: '$conversacion', total: { $sum: 1 } } }
      ])
    ]);
    const ultimoDe = new Map(ultimos.map(u => [u._id.toString(), u]));
    const noLeidosDe = new Map(noLeidos.map(n => [n._id.toString(), n.total]));

    res.json(conversaciones.map(c => {
      const u = ultimoDe.get(c._id.toString());
      return {
        _id: c._id,
        otro: c.participantes.find(p => p._id.toString() !== yo) || null,
        ultimoMensaje: u
          ? { texto: u.texto, createdAt: u.createdAt, mio: u.emisor.toString() === yo }
          : null,
        noLeidos: noLeidosDe.get(c._id.toString()) || 0
      };
    }));
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/chat/no-leidos -> { idDelAmigo: cantidadDeMensajesSinLeer }
router.get('/no-leidos', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;
    const mias = await Conversacion.find({ participantes: yo }).select('_id');

    const conteos = await MensajeChat.aggregate([
      {
        $match: {
          conversacion: { $in: mias.map(c => c._id) },
          emisor: { $ne: new mongoose.Types.ObjectId(yo) },
          leido: false
        }
      },
      { $group: { _id: '$emisor', total: { $sum: 1 } } }
    ]);

    res.json(Object.fromEntries(conteos.map(c => [c._id.toString(), c.total])));
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/chat  { destinatario } -> abre (o crea) la conversación con un amigo
router.post('/', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;
    const { destinatario } = req.body;

    if (!mongoose.isValidObjectId(destinatario)) {
      return res.status(400).json({ error: 'Usuario inválido' });
    }
    if (destinatario === yo) {
      return res.status(400).json({ error: 'No puedes chatear contigo mismo' });
    }
    if (!(await sonAmigos(yo, destinatario))) {
      return res.status(403).json({ error: 'Solo puedes chatear con tus amigos' });
    }

    let conv = await Conversacion.findOne({
      participantes: { $all: [yo, destinatario], $size: 2 }
    });
    if (!conv) {
      conv = await Conversacion.create({ participantes: [yo, destinatario] });
    }

    res.json({ _id: conv._id });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/chat/:id/mensajes -> los últimos mensajes (y los marca como leídos)
router.get('/:id/mensajes', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;
    const conv = await conversacionDe(req.params.id, yo);
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

    const otro = conv.participantes.find(p => p._id.toString() !== yo);

    // Lo que me escribió el otro ya lo estoy viendo
    await MensajeChat.updateMany(
      { conversacion: conv._id, emisor: { $ne: yo }, leido: false },
      { leido: true }
    );

    const ultimos = await MensajeChat.find({ conversacion: conv._id })
      .sort({ createdAt: -1 })
      .limit(200);
    ultimos.reverse(); // del más viejo al más nuevo

    res.json({
      otro,
      mensajes: ultimos.map(m => ({
        _id: m._id,
        texto: m.texto,
        createdAt: m.createdAt,
        mio: m.emisor.toString() === yo
      }))
    });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/chat/:id/mensajes  { texto }
router.post('/:id/mensajes', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;
    const conv = await conversacionDe(req.params.id, yo);
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

    const { error, datos } = validarMensajeChat(req.body);
    if (error) return res.status(400).json({ error });

    // Si dejaron de ser amigos, el historial se conserva pero ya no pueden escribirse
    const otro = conv.participantes.find(p => p._id.toString() !== yo);
    if (!otro || !(await sonAmigos(yo, otro._id.toString()))) {
      return res.status(403).json({ error: 'Ya no son amigos, no puedes enviar mensajes' });
    }

    const mensaje = await MensajeChat.create({
      conversacion: conv._id,
      emisor: yo,
      texto: datos.texto
    });

    res.status(201).json(mensaje);
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/chat/mensajes/:id  { texto }  (solo quien lo escribió)
router.put('/mensajes/:id', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const mensaje = await MensajeChat.findById(req.params.id);
    if (!mensaje) return res.status(404).json({ error: 'Mensaje no encontrado' });

    if (mensaje.emisor.toString() !== yo) {
      logger.warn('Intento de editar mensaje de chat ajeno', { mensajeId: req.params.id, por: yo });
      return res.status(403).json({ error: 'Solo puedes editar tus propios mensajes' });
    }

    const { error, datos } = validarMensajeChat(req.body);
    if (error) return res.status(400).json({ error });

    mensaje.set(datos);
    await mensaje.save();

    logger.info('Mensaje de chat actualizado', { mensajeId: req.params.id, por: yo });
    res.json({
      _id: mensaje._id,
      texto: mensaje.texto,
      createdAt: mensaje.createdAt,
      updatedAt: mensaje.updatedAt,
      mio: true
    });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/chat/mensajes/:id  (solo quien lo escribió)
router.delete('/mensajes/:id', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const mensaje = await MensajeChat.findById(req.params.id);
    if (!mensaje) return res.status(404).json({ error: 'Mensaje no encontrado' });

    if (mensaje.emisor.toString() !== yo) {
      logger.warn('Intento de borrar mensaje de chat ajeno', { mensajeId: req.params.id, por: yo });
      return res.status(403).json({ error: 'Solo puedes eliminar tus propios mensajes' });
    }

    await mensaje.deleteOne();

    logger.info('Mensaje de chat eliminado', { mensajeId: req.params.id, por: yo });
    res.json({ mensaje: 'Mensaje eliminado' });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/chat/:id  (cualquiera de los dos participantes; borra la conversación y sus mensajes)
router.delete('/:id', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;
    const conv = await conversacionDe(req.params.id, yo);
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

    const borrados = await MensajeChat.deleteMany({ conversacion: conv._id });
    await conv.deleteOne();

    logger.info('Conversación eliminada', {
      conversacionId: req.params.id, mensajes: borrados.deletedCount, por: yo
    });
    res.json({ mensaje: 'Conversación eliminada' });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
