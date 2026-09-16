// explorar.js
// Filtra las tarjetas de .movie-grid por género (chips) y por texto de búsqueda.
// TODO: al conectar el backend, reemplazar el filtrado en el DOM por una
// llamada real: GET /api/peliculas?genero=...&busqueda=...

document.addEventListener('DOMContentLoaded', () => {
  const chips = document.querySelectorAll('.chip');
  const searchInput = document.getElementById('buscador');
  const cards = document.querySelectorAll('.movie-card');
  let activeGenre = 'Todos';

  function applyFilters() {
    const term = (searchInput?.value || '').toLowerCase().trim();

    cards.forEach(card => {
      const genre = card.dataset.genero;
      const title = card.dataset.titulo.toLowerCase();
      const matchesGenre = activeGenre === 'Todos' || genre === activeGenre;
      const matchesSearch = title.includes(term);
      card.style.display = (matchesGenre && matchesSearch) ? '' : 'none';
    });
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeGenre = chip.dataset.genero;
      applyFilters();
    });
  });

  searchInput?.addEventListener('input', applyFilters);
});
