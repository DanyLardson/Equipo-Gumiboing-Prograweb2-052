//stars.js convierte cualquier .star-input en un selector de calificación de 1 a 5.
//guarda el valor elegido en el atributo data-value del propio contenedor, listo para leerse cuando el formulario se conecte a la API real.

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.star-input').forEach(container => {
    const icons = Array.from(container.querySelectorAll('i'));
    let current = parseInt(container.dataset.value || '0', 10);

    function paint(value) {
      icons.forEach((icon, index) => {
        icon.classList.toggle('filled', index < value);
        icon.className = 'ti ' + (index < value ? 'ti-star-filled' : 'ti-star') + ' ' + (index < value ? 'filled' : '');
      });
    }

    paint(current);

    icons.forEach((icon, index) => {
      icon.addEventListener('mouseenter', () => paint(index + 1));
      icon.addEventListener('click', () => {
        current = index + 1;
        container.dataset.value = current;
        paint(current);
      });
    });

    container.addEventListener('mouseleave', () => paint(current));
  });
});
