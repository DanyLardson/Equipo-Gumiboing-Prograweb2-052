// Un solo lugar para saber quién hace la petición y si puede modificar algo.
// Cuando migremos a JWT, solo hay que cambiar usuarioActual().

function usuarioActual(req) {
  return { id: req.session.userId, rol: req.session.rol };
}

function esAdmin(req) {
  return usuarioActual(req).rol === 'admin';
}

// ¿Puede editar/borrar algo cuyo dueño es duenoId? Sí si es el dueño o un admin.
function puedeModificar(req, duenoId) {
  const u = usuarioActual(req);
  if (u.rol === 'admin') return true;
  return !!duenoId && !!u.id && String(duenoId) === String(u.id);
}

module.exports = { usuarioActual, esAdmin, puedeModificar };
