const express = require('express');
const router = express.Router();
const Amistad = require('../models/Amistad');

router.get('/', async (req, res) => {
  try {
    const amistades = await Amistad.find({
      $or: [{ solicitante: req.session.userId }, { destinatario: req.session.userId }]
    }).populate('solicitante', 'username').populate('destinatario', 'username');
    res.json(amistades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const nueva = new Amistad({ solicitante: req.session.userId, destinatario: req.body.destinatario });
    await nueva.save();
    res.status(201).json(nueva);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;