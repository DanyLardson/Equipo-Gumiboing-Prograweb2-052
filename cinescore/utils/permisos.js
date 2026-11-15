function usuarioActual(req) {
  return req.user ? { id: req.user.id, rol: req.user.rol } : { id: undefined, rol: undefined };
}

function esAdmin(req) {
  return usuarioActual(req).rol === 'admin';
}

// solo dueños y admin pueden editar
function puedeModificar(req, duenoId) {
  const u = usuarioActual(req);
  if (u.rol === 'admin') return true;
  return !!duenoId && !!u.id && String(duenoId) === String(u.id);
}

module.exports = { usuarioActual, esAdmin, puedeModificar };
