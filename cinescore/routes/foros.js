const express = require('express');
const router = express.Router();
const Foro = require('../models/Foro');
const MensajeForo = require('../models/MensajeForo');

// 1. Obtener todos los foros de una película (o todos)
router.get('/', async (req, res) => {
  try {
    const foros = await Foro.find()
      .populate('pelicula', 'titulo')
      .populate('creadoPor', 'username');
    res.json(foros);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Crear un foro nuevo
router.post('/', async (req, res) => {
  try {
    // req.session.userId viene del login de tu amigo
    const nuevoForo = new Foro({ 
      ...req.body, 
      creadoPor: req.session.userId 
    });
    await nuevoForo.save();
    res.status(201).json(nuevoForo);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Obtener los mensajes de un foro específico
router.get('/:id/mensajes', async (req, res) => {
  try {
    const mensajes = await MensajeForo.find({ foro: req.params.id })
      .populate('usuario', 'username');
    res.json(mensajes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Enviar un mensaje a un foro
router.post('/:id/mensajes', async (req, res) => {
  try {
    const nuevoMensaje = new MensajeForo({ 
      foro: req.params.id, 
      usuario: req.session.userId, 
      texto: req.body.texto 
    });
    await nuevoMensaje.save();
    res.status(201).json(nuevoMensaje);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;