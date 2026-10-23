// chat.html: chat 1 a 1 con tus amigos.
// Cada 3 segundos se pregunta al servidor por mensajes nuevos.

let amigos = [];          // lista de amigos
let sinLeer = {};       
let amigoActual = null;   // amigo con el que estoy chateando
let conversacionId = null;
let ultimoMensajeId = null;

const thread = () => document.getElementById('chat-thread');

function pintarAmigos() {
  const cont = document.getElementById('lista-amigos');

  if (amigos.length === 0) {
    cont.innerHTML = '<p style="color:var(--text-muted); font-size:13px;">Aún no tienes amigos. Usa el ícono de arriba para buscar.</p>';
    return;
  }

  cont.innerHTML = amigos.map(a => {
    const activo = amigoActual && amigoActual._id === a._id;
    const n = sinLeer[a._id] || 0;
    return `
      <div class="friend-item ${activo ? 'active' : ''}" data-id="${a._id}">
        ${avatarHTML(a, 38)}
        <span style="flex:1; font-size:14px; ${activo ? '' : 'color:var(--text-muted);'}">${escapar(a.username)}</span>
        ${n ? `<span style="background:var(--accent-red); color:#fff; border-radius:10px; padding:2px 8px; font-size:11px;">${n}</span>` : ''}
      </div>`;
  }).join('');
}

async function cargarAmigos() {
  const res = await fetch('/api/amigos');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  amigos = data.amigos.map(a => a.usuario);
  await actualizarSinLeer();
  pintarAmigos();
}

async function actualizarSinLeer() {
  const res = await fetch('/api/chat/no-leidos');
  if (!res.ok) return;
  sinLeer = await res.json();
}

async function cargarMensajes(forzar = false) {
  if (!conversacionId) return;
  const idPedido = conversacionId;

  const res = await fetch(`/api/chat/${idPedido}/mensajes`);
  const data = await res.json();
  if (!res.ok || idPedido !== conversacionId) return; // cambié de chat mientras cargaba

  const ultimo = data.mensajes.length ? data.mensajes[data.mensajes.length - 1]._id : null;
  if (!forzar && ultimo === ultimoMensajeId) return; // nada nuevo
  ultimoMensajeId = ultimo;

  thread().innerHTML = data.mensajes.length
    ? data.mensajes.map(m => `<div class="chat-bubble ${m.mio ? 'outgoing' : 'incoming'}">${escapar(m.texto)}</div>`).join('')
    : '<p style="color:var(--text-muted); font-size:13px;">Aún no hay mensajes. ¡Saluda!</p>';
  thread().scrollTop = thread().scrollHeight;
}

async function abrirChat(amigo) {
  const { ok, status, data } = await postJSON('/api/chat', { destinatario: amigo._id });
  if (status === 401) {
    window.location.href = 'login.html';
    return;
  }
  if (!ok) {
    alert(data.error);
    return;
  }

  amigoActual = amigo;
  conversacionId = data._id;
  ultimoMensajeId = null;
  sinLeer[amigo._id] = 0;

  document.getElementById('chat-with-name').textContent = amigo.username;
  document.getElementById('chat-avatar').innerHTML = avatarHTML(amigo, 40);
  document.getElementById('chat-input').disabled = false;
  document.getElementById('chat-enviar').disabled = false;

  pintarAmigos();
  await cargarMensajes(true);
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('lista-amigos').addEventListener('click', (e) => {
    const item = e.target.closest('.friend-item');
    if (!item) return;
    const amigo = amigos.find(a => a._id === item.dataset.id);
    if (amigo) abrirChat(amigo);
  });

  document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const texto = input.value.trim();
    if (!texto || !conversacionId) return;

    const { ok, data } = await postJSON(`/api/chat/${conversacionId}/mensajes`, { texto });
    if (!ok) {
      alert(data.error);
      return;
    }
    input.value = '';
    await cargarMensajes(true);
  });

  cargarAmigos().catch(err => {
    document.getElementById('lista-amigos').textContent = 'No se pudo cargar la lista de amigos.';
    console.error(err);
  });

  // Revisa mensajes nuevos cada 3 segundos
  setInterval(async () => {
    try {
      await actualizarSinLeer();
      if (amigoActual) sinLeer[amigoActual._id] = 0; // el chat abierto ya se está leyendo
      pintarAmigos();
      await cargarMensajes();
    } catch (err) {
      console.error(err);
    }
  }, 3000);
});