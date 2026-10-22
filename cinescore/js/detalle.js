const peliculaId = new URLSearchParams(window.location.search).get('id');

function crearResena(r) {
  const nombre = escapar(r.usuario ? r.usuario.username : 'Usuario eliminado');
  return `
    <div class="dark-panel" style="padding:18px; margin-bottom:12px;">
      <div style="display:flex; gap:12px;">
        <div class="avatar"></div>
        <div>
          <p style="font-weight:600; margin:0;">${nombre} <span class="stars">${estrellas(r.calificacion)}</span></p>
          <p style="font-weight:600; margin:6px 0 0;">${escapar(r.titulo)}</p>
          <p style="color:var(--text-muted); font-size:13px; margin:6px 0 0;">${escapar(r.texto)}</p>
        </div>
      </div>
      <div style="display:flex; gap:16px; margin-top:12px; padding-top:12px; border-top:1px solid var(--border-dark);">
        <button class="like-btn ${r.yoLeDiLike ? 'liked' : ''}" data-url="/api/resenas/${r._id}/like">
          <i class="ti ti-heart" aria-hidden="true"></i>
          <span class="like-count">${r.likes}</span>
        </button>
      </div>
    </div>`;
}

async function cargarPelicula() {
  const res = await fetch('/api/peliculas/' + peliculaId);
  const peli = await res.json();
  if (!res.ok) throw new Error(peli.error);

  const respaldo = `https://placehold.co/300x450/0d1a17/F2B134?text=${encodeURIComponent(peli.titulo)}`;
  const img = document.getElementById('poster');
  img.src = peli.poster || respaldo;
  img.alt = 'Póster de ' + peli.titulo;
  img.onerror = () => { img.onerror = null; img.src = respaldo; };

  document.title = peli.titulo + ' — CineScore';
  document.getElementById('titulo').textContent = peli.titulo;
  document.getElementById('director').textContent = `Dir. ${peli.director} · ${peli.anio}`;
  document.getElementById('genero').textContent = peli.genero;
  document.getElementById('sinopsis').textContent = peli.sinopsis || '';
  document.getElementById('promedio').textContent =
    `${estrellas(peli.promedioCalificacion)} ${peli.promedioCalificacion} / 5 · ${peli.totalResenas} reseñas`;

  document.getElementById('btn-resena').href = 'escribir-resena.html?id=' + peli._id;
}

async function cargarResenas() {
  const res = await fetch('/api/resenas?pelicula=' + peliculaId);
  const lista = await res.json();
  if (!res.ok) throw new Error(lista.error);

  const cont = document.getElementById('resenas');
  cont.innerHTML = lista.length
    ? lista.map(crearResena).join('')
    : '<p style="color:var(--text-muted);">Aún no hay reseñas. ¡Escribe la primera!</p>';
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!peliculaId) {
    document.getElementById('resenas').textContent = 'Película no especificada.';
    return;
  }
  try {
    await cargarPelicula();
    await cargarResenas();
  } catch (err) {
    document.getElementById('resenas').textContent = 'No se pudo cargar la película.';
    console.error(err);
  }
});