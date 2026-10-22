function crearReciente(r) {
  const peli = r.pelicula;
  const titulo = peli ? escapar(peli.titulo) : 'Película eliminada';
  const respaldo = `https://placehold.co/60x84/1a1408/F2B134?text=${encodeURIComponent(peli ? peli.titulo[0] : '?')}`;
  const poster = peli && peli.poster ? escapar(peli.poster) : respaldo;
  const enlace = peli ? `detalle.html?id=${peli._id}` : '#';

  return `
    <a class="card" href="${enlace}" style="display:flex; align-items:center; gap:14px; margin-bottom:10px;">
      <img src="${poster}" alt="" width="60" height="84" style="border-radius:6px; object-fit:cover;"
        onerror="this.onerror=null;this.src='${respaldo}'">
      <div style="flex:1;">
        <p style="font-weight:600; margin:0;">${titulo}</p>
        <span class="stars">${estrellas(r.calificacion)}</span>
        <p style="margin:4px 0 0; font-size:13px;">${escapar(r.titulo)}</p>
      </div>
      <span style="color:#a3a39a; font-size:12px;">${haceTiempo(r.createdAt)}</span>
    </a>`;
}

function pintarUsuario(u) {
  document.getElementById('username').textContent = u.username;
  document.getElementById('bio').textContent = u.bio || 'Sin biografía todavía';

  const avatar = document.getElementById('avatar');
  if (u.avatar) {
    avatar.style.backgroundImage = `url(${JSON.stringify(u.avatar)})`;
    avatar.style.backgroundSize = 'cover';
    avatar.style.backgroundPosition = 'center';
  } else {
    avatar.style.backgroundImage = '';
  }
}

async function cargarPerfil() {
  const res = await fetch('/api/usuarios/me');
  if (res.status === 401) {
    window.location.href = 'login.html';
    return;
  }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  pintarUsuario(data.usuario);
  document.getElementById('stat-resenas').textContent = data.stats.resenas;
  document.getElementById('stat-comentarios').textContent = data.stats.comentarios;
  document.getElementById('stat-likes').textContent = data.stats.likes;

  document.getElementById('recientes').innerHTML = data.recientes.length
    ? data.recientes.map(crearReciente).join('')
    : '<p style="color:#7a7a72;">Aún no has escrito reseñas.</p>';

  // Datos actuales para el formulario de edición
  document.getElementById('input-bio').value = data.usuario.bio || '';
  document.getElementById('input-avatar').value = data.usuario.avatar || '';
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-perfil');

  document.getElementById('btn-editar').addEventListener('click', () => {
    form.hidden = !form.hidden;
  });
  document.getElementById('btn-cancelar').addEventListener('click', () => {
    form.hidden = true;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { ok, data } = await putJSON('/api/usuarios/me', {
      bio: document.getElementById('input-bio').value,
      avatar: document.getElementById('input-avatar').value
    });
    if (!ok) {
      alert(data.error);
      return;
    }
    pintarUsuario(data);
    form.hidden = true;
  });

  document.getElementById('btn-logout').addEventListener('click', async () => {
    await postJSON('/api/auth/logout');
    window.location.href = 'login.html';
  });

  cargarPerfil().catch(err => {
    document.getElementById('recientes').textContent = 'No se pudo cargar el perfil.';
    console.error(err);
  });
});