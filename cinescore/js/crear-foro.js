const peliculaPreseleccionada = new URLSearchParams(window.location.search).get('pelicula');

async function cargarPeliculas() {
  const res = await fetch('/api/peliculas');
  const lista = await res.json();
  if (!res.ok) throw new Error(lista.error);

  const select = document.getElementById('pelicula');
  lista.forEach(p => {
    const opcion = document.createElement('option');
    opcion.value = p._id;
    opcion.textContent = `${p.titulo} (${p.anio})`; // textContent: seguro contra HTML
    select.appendChild(opcion);
  });

  if (peliculaPreseleccionada) select.value = peliculaPreseleccionada;
}

document.addEventListener('DOMContentLoaded', () => {
  cargarPeliculas().catch(err => {
    alert('No se pudieron cargar las películas');
    console.error(err);
  });

  document.getElementById('crear-foro-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const { ok, status, data } = await postJSON('/api/foros', {
      pelicula: document.getElementById('pelicula').value,
      titulo: document.getElementById('titulo').value.trim(),
      descripcion: document.getElementById('descripcion').value.trim()
    });

    if (status === 401) {
      window.location.href = 'login.html';
      return;
    }
    if (!ok) {
      alert(data.error);
      return;
    }
    window.location.href = 'foro.html?id=' + data._id;
  });
});