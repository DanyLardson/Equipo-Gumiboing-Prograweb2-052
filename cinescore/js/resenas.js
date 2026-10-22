const peliculaId = new URLSearchParams(window.location.search).get('id');

document.addEventListener('DOMContentLoaded', async () => {
  if (!peliculaId) {
    window.location.href = 'explorar.html';
    return;
  }

  // Mostrar el nombre de la película
  try {
    const res = await fetch('/api/peliculas/' + peliculaId);
    const peli = await res.json();
    if (!res.ok) throw new Error(peli.error);
    document.getElementById('titulo-pelicula').textContent = `${peli.titulo} (${peli.anio})`;
  } catch (err) {
    alert('Película no encontrada');
    window.location.href = 'explorar.html';
    return;
  }

  document.getElementById('resena-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const calificacion = Number(document.querySelector('.star-input').dataset.value);
    if (!calificacion) {
      alert('Selecciona una calificación antes de publicar.');
      return;
    }

    const body = {
      pelicula: peliculaId,
      calificacion,
      titulo: document.getElementById('titulo').value.trim(),
      texto: document.getElementById('texto').value.trim()
    };

    const { ok, status, data } = await postJSON('/api/resenas', body);

    if (status === 401) {
      window.location.href = 'login.html';
      return;
    }
    if (ok) {
      window.location.href = 'detalle.html?id=' + peliculaId;
    } else {
      alert(data.error);
    }
  });
});