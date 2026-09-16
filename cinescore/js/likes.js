// likes.js
// Sistema de "me gusta" reutilizable para reseñas, comentarios y mensajes de foro.
// Por ahora solo cambia el estado visualmente y suma/resta del contador local.
// TODO: al conectar el backend, reemplazar el toggle local por:
//   POST /api/resenas/:id/like   (o /comentarios/:id/like, /foro-mensajes/:id/like)
//   y refrescar el contador con la respuesta del servidor.

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
