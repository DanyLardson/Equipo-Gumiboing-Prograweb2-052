let temporizador;

function botonRelacion(u) {
  switch (u.relacion) {
    case 'amigos':
      return '<button class="btn-friend accepted" disabled><i class="ti ti-check" aria-hidden="true"></i> Amigos</button>';
    case 'enviada':
      return '<button class="btn-friend sent" disabled><i class="ti ti-clock" aria-hidden="true"></i> Solicitud enviada</button>';
    case 'recibida':
      return `<button class="btn-friend" data-action="aceptar" data-id="${u.amistadId}"><i class="ti ti-check" aria-hidden="true"></i> Aceptar</button>`;
    default:
      return `<button class="btn-friend" data-action="solicitar" data-id="${u._id}"><i class="ti ti-user-plus" aria-hidden="true"></i> Agregar</button>`;
  }
}

function crearResultado(u) {
  return `
    <div class="result-row">
      ${avatarHTML(u, 34)}
      <div class="info">
        <p>${escapar(u.username)}</p>
        <p>${u.resenas} ${u.resenas === 1 ? 'reseña' : 'reseñas'}</p>
      </div>
      ${botonRelacion(u)}
    </div>`;
}

function crearSolicitud(s) {
  return `
    <div class="result-row">
      ${avatarHTML(s.usuario, 34)}
      <div class="info">
        <p>${escapar(s.usuario.username)}</p>
        <p>Quiere ser tu amigo</p>
      </div>
      <button class="btn-friend" data-action="aceptar" data-id="${s.amistadId}"><i class="ti ti-check" aria-hidden="true"></i> Aceptar</button>
      <button class="btn-friend" data-action="rechazar" data-id="${s.amistadId}" style="margin-left:6px;"><i class="ti ti-x" aria-hidden="true"></i> Rechazar</button>
    </div>`;
}

async function cargarSolicitudes() {
  const res = await fetch('/api/amigos');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  document.getElementById('bloque-solicitudes').hidden = data.recibidas.length === 0;
  document.getElementById('solicitudes').innerHTML = data.recibidas.map(crearSolicitud).join('');
}

async function buscar() {
  const q = document.getElementById('buscador-amigos').value.trim();
  const res = await fetch('/api/amigos/buscar?q=' + encodeURIComponent(q));
  const lista = await res.json();
  if (!res.ok) throw new Error(lista.error);

  document.getElementById('resultados').innerHTML = lista.length
    ? lista.map(crearResultado).join('')
    : '<p style="color:var(--text-muted);">No se encontraron usuarios.</p>';
}

async function recargar() {
  await Promise.all([cargarSolicitudes(), buscar()]);
}

// Botones Agregar / Aceptar / Rechazar
document.addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const { action, id } = btn.dataset;
  btn.disabled = true;

  let respuesta;
  if (action === 'solicitar') {
    respuesta = await postJSON('/api/amigos', { destinatario: id });
  } else if (action === 'aceptar') {
    respuesta = await putJSON('/api/amigos/' + id, { estado: 'aceptada' });
  } else if (action === 'rechazar') {
    respuesta = await putJSON('/api/amigos/' + id, { estado: 'rechazada' });
  } else {
    return;
  }

  if (respuesta.status === 401) {
    window.location.href = 'login.html';
    return;
  }
  if (!respuesta.ok) alert(respuesta.data.error);

  recargar().catch(console.error);
});

document.addEventListener('DOMContentLoaded', () => {
  // Espera 300 ms después de la última tecla antes de buscar
  document.getElementById('buscador-amigos').addEventListener('input', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => buscar().catch(console.error), 300);
  });

  recargar().catch(err => {
    document.getElementById('resultados').textContent = 'No se pudo cargar la lista.';
    console.error(err);
  });
});