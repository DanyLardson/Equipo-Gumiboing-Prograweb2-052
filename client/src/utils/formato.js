//fechas y horas en spanish
export function fechaCorta(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString('es-MX') : '';
}

export function hora(fecha) {
  return fecha ? new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
}

export function fechaHora(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toDateString() === new Date().toDateString() ? hora(fecha) : `${fechaCorta(fecha)} ${hora(fecha)}`;
}
