//filtra las tarjetas de .movie-grid por genero y por texto de busqueda

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
