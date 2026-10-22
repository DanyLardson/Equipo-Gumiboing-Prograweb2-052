// Si el botón tiene data-url, el like se guarda en el servidor.
// Si no, solo cambia visualmente (de puro ejemplo pues).

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.like-btn');
  if (!btn) return;

  const countEl = btn.querySelector('.like-count');
  const url = btn.dataset.url;

  if (!url) {
    const liked = btn.classList.toggle('liked');
    countEl.textContent = parseInt(countEl.textContent, 10) + (liked ? 1 : -1);
    return;
  }

  const { ok, status, data } = await postJSON(url);
  if (status === 401) {
    window.location.href = 'login.html';
    return;
  }
  if (!ok) {
    alert(data.error);
    return;
  }
  btn.classList.toggle('liked', data.liked);
  countEl.textContent = data.likes;
});

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