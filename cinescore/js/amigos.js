// Maneja el botón Agregar, envía solicitud de amistad y el buscador de la ventana buscar-amigos.html
// POST:   enviara solicitud
// GET: buscara usuarios reales

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-action="solicitar"]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.remove('btn-friend');
      btn.classList.add('btn-friend', 'sent');
      btn.disabled = true;
      btn.innerHTML = '<i class="ti ti-clock" aria-hidden="true"></i> Solicitud enviada';
    });
  });

  const buscador = document.getElementById('buscador-amigos');
  const rows = document.querySelectorAll('.result-row');

  buscador?.addEventListener('input', () => {
    const term = buscador.value.toLowerCase().trim();
    rows.forEach(row => {
      const name = row.querySelector('.info p').textContent.toLowerCase();
      row.style.display = name.includes(term) ? '' : 'none';
    });
  });
});

