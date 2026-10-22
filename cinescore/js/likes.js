function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function estrellas(numero) {
  const llenas = Math.round(numero || 0);
  return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
}
