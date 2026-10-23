const foroId = new URLSearchParams(window.location.search).get('id');

function crearMensaje(m) {
  const autor = escapar(m.usuario ? m.usuario.username : 'Usuario eliminado');
  return `
    <div style="padding:22px 0; border-bottom:1px solid var(--border-dark); display:flex; gap:16px;">
            ${avatarHTML(m.usuario, 38)}
      <div style="flex:1;">
        <p style="font-weight:600; margin:0; font-size:14px;">${autor}
          <span style="color:var(--text-faint); font-weight:400; font-size:12px;">· ${haceTiempo(m.createdAt).toLowerCase()}</span>
        </p>
        <p style="color:#d5d5de; font-size:14px; line-height:1.6; margin:8px 0 12px;">${escapar(m.texto)}</p>
        <button class="like-btn ${m.yoLeDiLike ? 'liked' : ''}" data-url="/api/foros/mensajes/${m._id}/like">
          <i class="ti ti-heart" aria-hidden="true"></i>
          <span class="like-count">${m.likes}</span>
        </button>
      </div>
    </div>`;
}

async function cargarForo() {
  const res = await fetch('/api/foros/' + foroId);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  const { foro, mensajes } = data;
  const peli = foro.pelicula;
  const autor = foro.creadoPor ? foro.creadoPor.username : 'Usuario eliminado';

  document.title = foro.titulo + ' — CineScore';
  document.getElementById('titulo-foro').textContent = foro.titulo;
  document.getElementById('chip-pelicula').textContent = peli ? `${peli.titulo} (${peli.anio})` : 'Película eliminada';
  document.getElementById('total-respuestas').textContent =
    `${mensajes.length} ${mensajes.length === 1 ? 'respuesta' : 'respuestas'}`;

  const volver = document.getElementById('volver');
  if (peli) {
    volver.href = 'foros.html?pelicula=' + peli._id;
    volver.querySelector('span').textContent = 'Volver a foros de ' + peli.titulo;
  }

  document.getElementById('autor-foro').textContent = autor;
  document.getElementById('avatar-foro').innerHTML = avatarHTML(foro.creadoPor, 44);
  document.getElementById('fecha-foro').textContent = ' · inició el foro · ' + haceTiempo(foro.createdAt).toLowerCase();
  document.getElementById('descripcion-foro').textContent = foro.descripcion || '';

  document.getElementById('mensajes').innerHTML = mensajes.map(crearMensaje).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  if (!foroId) {
    window.location.href = 'foros.html';
    return;
  }

  cargarForo().catch(err => {
    document.getElementById('titulo-foro').textContent = 'No se pudo cargar el foro';
    console.error(err);
  });

  document.getElementById('foro-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('texto-respuesta');

    const { ok, status, data } = await postJSON(`/api/foros/${foroId}/mensajes`, {
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
    await cargarForo();
  });
});