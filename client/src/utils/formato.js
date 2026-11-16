export function fechaCorta(fecha) {
  return fecha ? new Date(fecha).toLocaleDateString('es-MX') : '';
}
