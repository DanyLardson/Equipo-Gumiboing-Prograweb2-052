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