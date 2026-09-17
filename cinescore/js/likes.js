//sistema de likes reutilizable para reseñas, comentarios y mensajes de foro.
// Por ahora solo cambia el estado visualmente y suma o resta del contador local.

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const countEl = btn.querySelector('.like-count');
      let count = parseInt(countEl.textContent, 10);
      const liked = btn.classList.toggle('liked');
      count = liked ? count + 1 : count - 1;
      countEl.textContent = count;
    });
  });
});
