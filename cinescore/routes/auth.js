const express = require('express');
const logger = require('../utils/logger');
const bcrypt = require('bcrypt');
const { Usuario } = require('../models');
const { requireLogin, generarToken, sesionPermitida } = require('../middleware/auth');
const { validarRegistro } = require('../utils/validaciones');

const router = express.Router();

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const { error, datos } = validarRegistro(req.body);
    if (error) return res.status(400).json({ error });

    const hash = await bcrypt.hash(datos.password, 10);
    await Usuario.create({ username: datos.username, email: datos.email, password: hash });
    logger.info('Usuario registrado', { username: datos.username, email: datos.email });

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
    // Se exige que sean texto 
    const email = typeof req.body.email === 'string' ? req.body.email.toLowerCase().trim() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan datos' });
    }

    const usuario = await Usuario.findOne({ email });
    const ok = usuario && await bcrypt.compare(password, usuario.password);

    if (!ok) {
      logger.warn('Intento de login fallido', { email });
      return res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }

    if (sesionPermitida() && req.session) {
      req.session.userId = usuario._id.toString();
      req.session.rol = usuario.rol;
    }

    // token que el cliente debe mandar en cada petición
    const token = generarToken(usuario);
    logger.info('Login exitoso', { userId: usuario._id.toString(), rol: usuario.rol });

    res.json({
      mensaje: 'Bienvenido',
      token,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
      usuario: {
        _id: usuario._id,
        username: usuario.username,
        rol: usuario.rol,
        avatar: usuario.avatar
      },
      username: usuario.username,
      rol: usuario.rol
    });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/auth/logout
// el token no se "cierra" en el servidor, el cliente lo descarta (y expira solo).
router.post('/logout', (req, res) => {
  logger.info('Logout', { userId: req.user ? req.user.id : undefined });
  if (req.session) {
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.json({ mensaje: 'Sesión cerrada' });
    });
  } else {
    res.json({ mensaje: 'Sesión cerrada' });
  }
});

// GET /api/auth/me
router.get('/me', requireLogin, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.user.id).select('-password');
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;