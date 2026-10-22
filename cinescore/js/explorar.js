// Pide las películas al servidor y las pinta en explorar.html

let generoActivo = 'Todos';
let temporizador;

// Evita que un título como <script> se ejecute en el navegador
function escapar(texto) {
  return String(texto ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 4.3 -> ★★★★☆
function estrellas(numero) {
  const llenas = Math.round(numero || 0);
  return '★'.repeat(llenas) + '☆'.repeat(5 - llenas);
}

function crearTarjeta(peli) {
  const titulo = escapar(peli.titulo);
  const respaldo = `https://placehold.co/300x450/1a1408/F2B134?text=${encodeURIComponent(peli.titulo)}`;
  const poster = peli.poster ? escapar(peli.poster) : respaldo;

  return `
    <a class="movie-card" href="detalle.html?id=${peli._id}">
      <img src="${poster}" alt="Póster de ${titulo}" onerror="this.onerror=null;this.src='${respaldo}'">
      <div class="info">
        <h3>${titulo}</h3>
        <p>${escapar(peli.genero)} · ${peli.anio}</p>
        <span class="stars">${estrellas(peli.promedioCalificacion)}</span>
      </div>
    </a>`;
}

function pintarPeliculas(lista) {
  const grid = document.getElementById('movie-grid');
  if (lista.length === 0) {
    grid.innerHTML = '<p>No se encontraron películas.</p>';
    return;
  }
  grid.innerHTML = lista.map(crearTarjeta).join('');
}

async function cargarPeliculas() {
  const params = new URLSearchParams();
  params.set('genero', generoActivo);
  params.set('q', document.getElementById('buscador').value.trim());

  try {
    const res = await fetch('/api/peliculas?' + params.toString());
    const lista = await res.json();
    if (!res.ok) throw new Error(lista.error);
    pintarPeliculas(lista);
  } catch (err) {
    document.getElementById('movie-grid').innerHTML = '<p>No se pudieron cargar las películas.</p>';
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const chips = document.querySelectorAll('.chip');

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      generoActivo = chip.dataset.genero;
      cargarPeliculas();
    });
  });

  // Espera 300 ms después de la última tecla antes de buscar
  document.getElementById('buscador').addEventListener('input', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(cargarPeliculas, 300);
  });

  cargarPeliculas();
});