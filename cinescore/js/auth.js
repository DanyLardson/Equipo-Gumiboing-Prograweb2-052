async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

const registroForm = document.getElementById('registro-form');
if (registroForm) {
  registroForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const password2 = document.getElementById('password2').value;

    if (password !== password2) {
      alert('Las contraseñas no coinciden.');
      return;
    }

    const { ok, data } = await postJSON('/api/auth/registro', { username, email, password });

    if (ok) {
      alert('Cuenta creada. Ahora inicia sesión.');
      window.location.href = 'login.html';
    } else {
      alert(data.error);
    }
  });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const { ok, data } = await postJSON('/api/auth/login', { email, password });

    if (ok) {
      window.location.href = 'explorar.html';
    } else {
      alert(data.error);
    }
  });
}