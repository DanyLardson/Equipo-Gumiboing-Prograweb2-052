import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Container, Link, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorEmail, errorPassword, errorUsername } from '../utils/validar';
import { colores } from '../theme';

export default function Registro() {
  const { registro } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: '', email: '', password: '', confirmar: '' });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function enviar(evento) {
    evento.preventDefault();
    setErrorServidor('');

    const nuevos = {};
    const eUser = errorUsername(form.username);
    const eMail = errorEmail(form.email);
    const ePass = errorPassword(form.password);
    if (eUser) nuevos.username = eUser;
    if (eMail) nuevos.email = eMail;
    if (ePass) nuevos.password = ePass;
    if (form.confirmar !== form.password) nuevos.confirmar = 'Las contraseñas no coinciden';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    try {
      setEnviando(true);
      await registro({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password
      });
      navigate('/login', { replace: true, state: { registrado: true } });
    } catch (err) {
      setErrorServidor(err.message);
      setEnviando(false);
    }
  }

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Typography variant="h3" align="center" sx={{ mb: 3 }}>
        Cine<span style={{ color: colores.dorado }}>Score</span>
      </Typography>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Crear cuenta
          </Typography>

          {errorServidor && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorServidor}
            </Alert>
          )}

          <Box component="form" onSubmit={enviar} noValidate sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Nombre de usuario"
              value={form.username}
              onChange={cambiar('username')}
              error={Boolean(errores.username)}
              helperText={errores.username}
              autoComplete="username"
              autoFocus
              fullWidth
            />
            <TextField
              label="Correo"
              type="email"
              value={form.email}
              onChange={cambiar('email')}
              error={Boolean(errores.email)}
              helperText={errores.email}
              autoComplete="email"
              fullWidth
            />
            <TextField
              label="Contraseña"
              type="password"
              value={form.password}
              onChange={cambiar('password')}
              error={Boolean(errores.password)}
              helperText={errores.password}
              autoComplete="new-password"
              fullWidth
            />
            <TextField
              label="Confirmar contraseña"
              type="password"
              value={form.confirmar}
              onChange={cambiar('confirmar')}
              error={Boolean(errores.confirmar)}
              helperText={errores.confirmar}
              autoComplete="new-password"
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" disabled={enviando}>
              {enviando ? 'Creando cuenta...' : 'Registrarme'}
            </Button>
          </Box>

          <Typography variant="body2" align="center" sx={{ mt: 3 }}>
            ¿Ya tienes cuenta?{' '}
            <Link component={RouterLink} to="/login">
              Inicia sesión
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
