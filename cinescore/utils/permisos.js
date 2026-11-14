//quién hace la petición y si puede modificar algo.
function usuarioActual(req) {
  return { id: req.session.userId, rol: req.session.rol };
}

function esAdmin(req) {
  return usuarioActual(req).rol === 'admin';
}

// solo puede editar el dueño o admin
function puedeModificar(req, duenoId) {
  const u = usuarioActual(req);
  if (u.rol === 'admin') return true;
  return !!duenoId && !!u.id && String(duenoId) === String(u.id);
}

module.exports = { usuarioActual, esAdmin, puedeModificar };
