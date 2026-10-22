function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Debes iniciar sesión' });
  }
  if (req.session.rol !== 'admin') {
    return res.status(403).json({ error: 'No tienes permiso para esto' });
  }
  next();
}

module.exports = { requireLogin, requireAdmin };