const form = document.getElementById('agregar-pelicula-form');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const body = {
      titulo: document.getElementById('titulo').value.trim(),
      anio: Number(document.getElementById('anio').value),
      director: document.getElementById('director').value.trim(),
      genero: document.getElementById('genero').value,
      poster: document.getElementById('poster').value.trim(),
      sinopsis: document.getElementById('sinopsis').value.trim()
    };

    const { ok, data } = await postJSON('/api/peliculas', body);

    if (ok) {
      alert('Película agregada');
      window.location.href = 'explorar.html';
    } else {
      alert(data.error);
    }
  });
}