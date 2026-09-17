//Se incluye en TODAS las páginas.
// Resalta el link del navbar que corresponde a la página actual usando el atributo data-page puesto en el <body>.

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;

  document.querySelectorAll('.navbar nav a').forEach(link => {
    if (link.dataset.page === currentPage) {
      link.classList.add('active');
    }
  });
});
