import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Container, Link, TextField, Typography } from '@mui/material';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorEmail } from '../utils/validar';
import { colores } from '../theme';

export default function Login() {
  const { login, sesionExpirada } = useAuth();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setErrorServidor('');

    const nuevos = {};
    const errEmail = errorEmail(email);
    if (errEmail) nuevos.email = errEmail;
    if (!password) nuevos.password = 'Escribe tu contraseña';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    try {
      setEnviando(true);
      // al iniciar sesión, RutaPublica redirige sola a la pantalla que corresponda
      await login(email.trim(), password);
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
            Iniciar sesión
          </Typography>

          {location.state?.registrado && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Cuenta creada. Ya puedes iniciar sesión.
            </Alert>
          )}
          {sesionExpirada && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Tu sesión expiró. Inicia sesión otra vez.
            </Alert>
          )}
          {errorServidor && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorServidor}
            </Alert>
          )}

          <Box component="form" onSubmit={enviar} noValidate sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Correo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={Boolean(errores.email)}
              helperText={errores.email}
              autoComplete="email"
              autoFocus
              fullWidth
            />
            <TextField
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={Boolean(errores.password)}
              helperText={errores.password}
              autoComplete="current-password"
              fullWidth
            />
            <Button type="submit" variant="contained" size="large" disabled={enviando}>
              {enviando ? 'Entrando...' : 'Entrar'}
            </Button>
          </Box>

          <Typography variant="body2" align="center" sx={{ mt: 3 }}>
            ¿No tienes cuenta?{' '}
            <Link component={RouterLink} to="/registro">
              Regístrate
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}
