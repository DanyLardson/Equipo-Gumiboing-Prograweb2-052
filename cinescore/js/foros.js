const peliculaId = new URLSearchParams(window.location.search).get('pelicula');

function crearForo(f) {
  const autor = escapar(f.creadoPor ? f.creadoPor.username : 'Usuario eliminado');
  // En la lista general se muestra a qué película pertenece cada foro
  const peli = !peliculaId && f.pelicula ? ` · ${escapar(f.pelicula.titulo)}` : '';
  const n = f.respuestas;

  return `
    <a href="foro.html?id=${f._id}" style="display:block; background:var(--bg-surface); border-radius:8px; padding:14px 18px; margin-bottom:10px;">
      <div style="display:flex; justify-content:space-between;">
        <span style="font-weight:600;">${escapar(f.titulo)}</span>
        <span style="color:var(--text-faint); font-size:12px;">${n} ${n === 1 ? 'respuesta' : 'respuestas'}</span>
      </div>
      <p style="color:var(--text-muted); font-size:12px; margin:6px 0 0;">Iniciado por ${autor}${peli} · ${haceTiempo(f.createdAt).toLowerCase()}</p>
    </a>`;
}

async function cargarForos() {
  const url = '/api/foros' + (peliculaId ? '?pelicula=' + peliculaId : '');
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  if (data.pelicula) {
    document.getElementById('sub-titulo').textContent = `${data.pelicula.titulo} (${data.pelicula.anio})`;
    document.getElementById('titulo-lista').textContent = 'Foros de esta película';
    document.getElementById('btn-crear').href = 'crear-foro.html?pelicula=' + peliculaId;
  } else {
    document.getElementById('sub-titulo').textContent = 'Todas las películas';
    document.getElementById('titulo-lista').textContent = 'Foros de la comunidad';
  }

  document.getElementById('lista-foros').innerHTML = data.foros.length
    ? data.foros.map(crearForo).join('')
    : '<p style="color:var(--text-muted);">Aún no hay foros. ¡Crea el primero!</p>';
}

document.addEventListener('DOMContentLoaded', () => {
  cargarForos().catch(err => {
    document.getElementById('lista-foros').textContent = 'No se pudieron cargar los foros.';
    console.error(err);
  });
});