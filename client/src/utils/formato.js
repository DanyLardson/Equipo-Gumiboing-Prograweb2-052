// Fecha corta en español: 15/11/2026
export function fechaCorta(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString('es-MX') : '';
}

// hora corta: 14:05
export function hora(fecha) {
  return fecha ? new Date(fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
}

// hoy solo la hora; otro día, fecha y hora
export function fechaHora(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toDateString() === new Date().toDateString() ? hora(fecha) : `${fechaCorta(fecha)} ${hora(fecha)}`;
}

// "2026-11" -> "nov 26"
export function mesCorto(mes) {
  const [anio, numero] = mes.split('-').map(Number);
  const nombre = new Date(Date.UTC(anio, numero - 1, 1)).toLocaleDateString('es-MX', { month: 'short', timeZone: 'UTC' });
  return `${nombre.replace('.', '')} ${String(anio).slice(2)}`;
}
