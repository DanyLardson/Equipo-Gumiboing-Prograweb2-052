const express = require('express');
const mongoose = require('mongoose');
const { Conversacion, MensajeChat, Amistad } = require('../models');
const { requireLogin } = require('../middleware/auth');

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
    console.error(err);
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
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/chat/:id/mensajes  { texto }
router.post('/:id/mensajes', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;
    const conv = await conversacionDe(req.params.id, yo);
    if (!conv) return res.status(404).json({ error: 'Conversación no encontrada' });

    const { texto } = req.body;
    if (!texto || !texto.trim()) {
      return res.status(400).json({ error: 'El mensaje está vacío' });
    }
    if (texto.length > 1000) {
      return res.status(400).json({ error: 'El mensaje es muy largo (máximo 1000 caracteres)' });
    }

    const mensaje = await MensajeChat.create({
      conversacion: conv._id,
      emisor: yo,
      texto: texto.trim()
    });

    res.status(201).json(mensaje);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;