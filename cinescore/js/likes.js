// Likes reutilizables (reseñas, comentarios, mensajes de foro).
// Si el botón tiene data-url, el like se guarda en el servidor.
// Si no, solo cambia visualmente (contenido de ejemplo).
// Un solo listener sirve también para botones creados después.

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