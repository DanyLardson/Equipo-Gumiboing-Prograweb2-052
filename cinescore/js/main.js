// Menú que ve un admin: solo Panel admin y Perfil
const NAV_ADMIN = `
  <a href="admin.html" data-page="admin">Panel admin</a>
  <a href="perfil.html" data-page="perfil">Perfil</a>`;

function marcarActivo() {
  const currentPage = document.body.dataset.page;
  if (!currentPage) return;

  document.querySelectorAll('.navbar nav a').forEach(link => {
    link.classList.toggle('active', link.dataset.page === currentPage);
  });
}

// Cambia el navbar al de admin
function aplicarNavAdmin() {
  const nav = document.querySelector('.navbar nav');
  if (!nav) return;
  nav.innerHTML = NAV_ADMIN;

  const logo = document.querySelector('.navbar .logo');
  if (logo && !logo.querySelector('.badge-admin')) {
    logo.insertAdjacentHTML('beforeend', ' <span class="badge-admin">ADMIN</span>');
  }
  marcarActivo();
}

document.addEventListener('DOMContentLoaded', () => {
  // Si el admin abre su perfil, que no vea el menú de usuario
  if (document.body.dataset.page === 'perfil' && sessionStorage.getItem('rol') === 'admin') {
    aplicarNavAdmin();
  }
  marcarActivo();
});
