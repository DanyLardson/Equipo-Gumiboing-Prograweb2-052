const express = require('express');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const { Usuario } = require('../models');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Faltan datos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const hash = await bcrypt.hash(password, 10);
    await Usuario.create({ username, email, password: hash });
    logger.info('Usuario registrado', { username, email });

    res.status(201).json({ mensaje: 'Cuenta creada' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Ese correo o usuario ya está registrado' });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    const usuario = await Usuario.findOne({ email: email.toLowerCase().trim() });
    const ok = usuario && await bcrypt.compare(password, usuario.password);

    if (!ok) {
      logger.warn('Intento de login fallido', { email });
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    req.session.userId = usuario._id.toString();
    req.session.rol = usuario.rol;
    logger.info('Login exitoso', { userId: usuario._id.toString(), rol: usuario.rol });

    res.json({ mensaje: 'Bienvenido', username: usuario.username, rol: usuario.rol });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  logger.info('Logout', { userId: req.session.userId });
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ mensaje: 'Sesión cerrada' });
  });
});

// GET /api/auth/me
router.get('/me', requireLogin, async (req, res) => {
  const usuario = await Usuario.findById(req.session.userId).select('-password');
  if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });
  res.json(usuario);
});

module.exports = router;