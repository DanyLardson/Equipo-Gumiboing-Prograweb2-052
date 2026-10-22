const path = require('path');

// Páginas que se pueden ver sin iniciar sesión
const paginasPublicas = ['login.html', 'registro.html'];

// Rutas de la API que se pueden usar sin iniciar sesión
const apiPublica = ['/auth/registro', '/auth/login'];

// Protege las rutas de la API: requiere sesión
function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  next();
}

// Protege las rutas de la API: requiere sesión y rol admin
function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  if (req.session.rol !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para esto' });
  }
  next();
}

// Guardia de páginas: sin sesión, cualquier .html (o "/") manda al login
function protegerPaginas(req, res, next) {
  const esPagina = req.path === '/' || req.path.endsWith('.html');
  if (esPagina && !req.session.userId && !paginasPublicas.includes(path.basename(req.path))) {
    return res.redirect('/login.html');
  }
  next();
}

// Guardia de la API: todo /api requiere sesión, menos registro y login
function protegerApi(req, res, next) {
  if (apiPublica.includes(req.path)) return next();
  requireLogin(req, res, next);
}

module.exports = { requireLogin, requireAdmin, protegerPaginas, protegerApi };