// detalle.html: muestra una película, sus reseñas y los comentarios de cada reseña

const peliculaId = new URLSearchParams(window.location.search).get('id');

function crearComentario(c) {
  const nombre = escapar(c.usuario ? c.usuario.username : 'Usuario eliminado');
  return `
    <div style="padding:10px 0; border-top:1px solid var(--border-dark);">
      <p style="margin:0; font-weight:600; font-size:13px;">${nombre}</p>
      <p style="margin:4px 0 0; color:var(--text-muted); font-size:13px;">${escapar(c.texto)}</p>
      <button class="like-btn ${c.yoLeDiLike ? 'liked' : ''}" data-url="/api/comentarios/${c._id}/like" style="margin-top:6px;">
        <i class="ti ti-heart" aria-hidden="true"></i>
        <span class="like-count">${c.likes}</span>
      </button>
    </div>`;
}

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
        <button class="toggle-comentarios" data-id="${r._id}"
          style="background:none; border:0; cursor:pointer; display:flex; align-items:center; gap:5px; color:var(--text-faint); font-size:13px;">
          <i class="ti ti-message-circle" aria-hidden="true"></i>
          <span class="total-comentarios">${r.comentarios}</span> comentarios
        </button>
      </div>
      <div id="comentarios-${r._id}" hidden style="margin-top:12px;">
        <div class="lista-comentarios"></div>
        <form class="form-comentario" data-id="${r._id}" style="display:flex; gap:8px; margin-top:10px;">
          <input type="text" placeholder="Escribe un comentario..." maxlength="500" required
            style="flex:1; padding:8px 12px; border-radius:20px; border:1px solid var(--border-dark); background:transparent; color:inherit; font-size:13px;">
          <button type="submit" class="btn btn-primary" style="padding:8px 14px;">Enviar</button>
        </form>
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

// Trae los comentarios de una reseña y los pinta en su panel
async function cargarComentarios(resenaId) {
  const res = await fetch('/api/comentarios?resena=' + resenaId);
  const lista = await res.json();
  if (!res.ok) throw new Error(lista.error);

  const panel = document.getElementById('comentarios-' + resenaId);
  panel.querySelector('.lista-comentarios').innerHTML = lista.map(crearComentario).join('');

  // Actualiza el número del botón
  document.querySelector(`.toggle-comentarios[data-id="${resenaId}"] .total-comentarios`)
    .textContent = lista.length;
}

// Clic en "N comentarios": abre o cierra el panel (carga la lista la primera vez)
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('.toggle-comentarios');
  if (!btn) return;

  const panel = document.getElementById('comentarios-' + btn.dataset.id);
  panel.hidden = !panel.hidden;

  if (!panel.hidden && !panel.dataset.cargado) {
    try {
      await cargarComentarios(btn.dataset.id);
      panel.dataset.cargado = '1';
    } catch (err) {
      console.error(err);
    }
  }
});

// Enviar un comentario
document.addEventListener('submit', async (e) => {
  const form = e.target.closest('.form-comentario');
  if (!form) return;
  e.preventDefault();

  const input = form.querySelector('input');
  const { ok, status, data } = await postJSON('/api/comentarios', {
    resena: form.dataset.id,
    texto: input.value.trim()
  });

  if (status === 401) {
    window.location.href = 'login.html';
    return;
  }
  if (!ok) {
    alert(data.error);
    return;
  }

  input.value = '';
  await cargarComentarios(form.dataset.id);
});

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