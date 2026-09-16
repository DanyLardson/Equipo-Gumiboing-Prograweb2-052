// admin.js
// Acciones del panel de administración sobre contenido reportado.
// TODO: al conectar el backend:
//   DELETE /api/moderacion/:tipo/:id   -> eliminar reseña/comentario/foro
//   GET    /api/moderacion/reportes    -> traer la lista real de reportes

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-action="eliminar"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('.report-row');
      const confirmed = confirm('¿Eliminar este contenido reportado? Esta acción no se puede deshacer.');
      if (confirmed) {
        row.remove();
      }
    });
  });

  document.querySelectorAll('[data-action="ver"]').forEach(btn => {
    btn.addEventListener('click', () => {
      alert('Aquí se abriría el contenido original para revisarlo en contexto.');
    });
  });
});
