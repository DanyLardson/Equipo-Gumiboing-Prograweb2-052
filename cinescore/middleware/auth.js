const path = require('path');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { Usuario } = require('../models');

// Páginas públicas
const paginasPublicas = ['login.html', 'registro.html'];

// solo registro y login se pueden ver sin token
const apiPublica = ['/auth/registro', '/auth/login'];

function sesionPermitida() {
  return process.env.PERMITIR_SESION !== 'false';
}

// genera el token que se entrega al iniciar sesión
function generarToken(usuario) {
  return jwt.sign(
    { rol: usuario.rol },
    process.env.JWT_SECRET,
    {
      subject: String(usuario._id),
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
      algorithm: 'HS256'
    }
  );
}

// identifica quién hace la petición (id, admin)
async function identificar(req, res, next) {
  req.user = null;

  // login y registro no llevan token
  if (apiPublica.includes(req.path)) return next();

  try {
    const cabecera = req.headers.authorization;

    if (cabecera) {
      const [tipo, token] = cabecera.split(' ');
      if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Token inválido' });
      }

      let payload;
      try {
        payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      } catch (err) {
        const expirado = err.name === 'TokenExpiredError';
        if (!expirado) logger.warn('Token inválido recibido', { ruta: req.originalUrl });
        return res.status(401).json({
          error: expirado ? 'Tu sesión expiró, inicia sesión otra vez' : 'Token inválido'
        });
      }

      const usuario = await Usuario.findById(payload.sub).select('rol');
      if (!usuario) {
        return res.status(401).json({ error: 'La cuenta ya no existe' });
      }
      req.user = { id: String(usuario._id), rol: usuario.rol };
      return next();
    }

    // respaldo temporal la sesión por cookie 
    if (sesionPermitida() && req.session && req.session.userId) {
      req.user = { id: req.session.userId, rol: req.session.rol };
    }
    next();
  } catch (err) {
    logger.error(`Error al identificar al usuario en ${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
}

// protege las rutas de la API (requiere un usuario identificado)
function requireLogin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  next();
}

// protege las rutas de la API (solo admin)
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para esto' });
  }
  next();
}

// sin sesión, cualquier .html (o "/") manda al login.
function protegerPaginas(req, res, next) {
  const esPagina = req.path === '/' || req.path.endsWith('.html');
  const haySesion = !!(req.session && req.session.userId);
  if (esPagina && !haySesion && !paginasPublicas.includes(path.basename(req.path))) {
    return res.redirect('/login.html');
  }
  next();
}

// todo api requiere token, menos registro y login
function protegerApi(req, res, next) {
  if (apiPublica.includes(req.path)) return next();
  requireLogin(req, res, next);
}

module.exports = {
  generarToken, identificar, sesionPermitida,
  requireLogin, requireAdmin, protegerPaginas, protegerApi
};
