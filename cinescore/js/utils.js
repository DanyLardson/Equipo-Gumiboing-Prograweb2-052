// Funciones compartidas entre páginas

// Evita que un texto como <script> se ejecute en el navegador
function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 4.3 -> ★★★★☆
function estrellas(numero) {
  const llenas = Math.round(numero || 0);
  return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
}

// Fecha -> "Hace 2 días"
function haceTiempo(fecha) {
  const seg = Math.floor((Date.now() - new Date(fecha)) / 1000);
  const unidades = [
    ['año', 31536000], ['mes', 2592000], ['semana', 604800],
    ['día', 86400], ['hora', 3600], ['minuto', 60]
  ];
  for (const [nombre, valor] of unidades) {
    const n = Math.floor(seg / valor);
    if (n >= 1) {
      const plural = n === 1 ? nombre : (nombre === 'mes' ? 'meses' : nombre + 's');
      return `Hace ${n} ${plural}`;
    }
  }
  return 'Hace un momento';
}