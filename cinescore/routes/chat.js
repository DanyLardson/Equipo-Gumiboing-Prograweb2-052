const express = require('express');
const router = express.Router();
const Conversacion = require('../models/Conversacion');
const MensajeChat = require('../models/MensajeChat');

router.get('/', async (req, res) => {
  try {
    const conversaciones = await Conversacion.find({ participantes: req.session.userId }).populate('participantes', 'username');
    res.json(conversaciones);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const nueva = new Conversacion({ participantes: [req.session.userId, req.body.destinatario] });
    await nueva.save();
    res.status(201).json(nueva);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/mensajes', async (req, res) => {
  try {
    const mensaje = new MensajeChat({ conversacion: req.params.id, emisor: req.session.userId, texto: req.body.texto });
    await mensaje.save();
    res.status(201).json(mensaje);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;