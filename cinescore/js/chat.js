// chat.js
// Demo de front-end para el chat en tiempo real.
// Aquí solo se agrega el mensaje a la ventana actual.
// TODO: al conectar el backend, sustituir por WebSockets / Socket.io:
//   socket.emit('mensaje', { conversacionId, texto });
//   socket.on('mensaje', (msg) => agregarMensaje(msg));

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const thread = document.getElementById('chat-thread');
  const friends = document.querySelectorAll('.friend-item');
  const chatWithName = document.getElementById('chat-with-name');

  function addMessage(text, outgoing) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble ' + (outgoing ? 'outgoing' : 'incoming');
    bubble.textContent = text;
    thread.appendChild(bubble);
    thread.scrollTop = thread.scrollHeight;
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    addMessage(text, true);
    input.value = '';
  });

  friends.forEach(item => {
    item.addEventListener('click', () => {
      friends.forEach(f => f.classList.remove('active'));
      item.classList.add('active');
      chatWithName.textContent = item.dataset.name;
      thread.innerHTML = '';
      addMessage('Nueva conversación con ' + item.dataset.name, false);
    });
  });
});
