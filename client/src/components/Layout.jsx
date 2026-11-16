import { useCallback, useEffect, useState } from 'react';
import { AppBar, Badge, Box, Button, Chip, Container, Toolbar, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePolling } from '../hooks/usePolling';
import { api } from '../services/api';
import { colores } from '../theme';

// Menú según el rol: el admin solo ve el panel y su perfil
const ENLACES_USUARIO = [
  { a: '/', texto: 'Explorar' },
  { a: '/foros', texto: 'Foros' },
  { a: '/amigos', texto: 'Amigos' },
  { a: '/chat', texto: 'Chat' },
  { a: '/perfil', texto: 'Perfil' }
];
const ENLACES_ADMIN = [
  { a: '/admin', texto: 'Panel admin' },
  { a: '/perfil', texto: 'Perfil' }
];

// total de mensajes sin leer, para el aviso en "Chat"
function useNoLeidos(activo) {
  const [total, setTotal] = useState(0);

  const cargar = useCallback(() => {
    api.get('/api/chat/no-leidos')
      .then((porAmigo) => setTotal(Object.values(porAmigo).reduce((suma, n) => suma + n, 0)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activo) cargar();
  }, [activo, cargar]);

  usePolling(() => {
    if (activo) cargar();
  }, 8000);

  return total;
}

export default function Layout() {
  const { esAdmin, logout } = useAuth();
  const noLeidos = useNoLeidos(!esAdmin);
  const { pathname } = useLocation();
  const enlaces = esAdmin ? ENLACES_ADMIN : ENLACES_USUARIO;

  // el enlace queda marcado también dentro de sus pantallas hijas (detalle, formularios)
  const activo = (a) =>
    pathname === a ||
    (a === '/' && pathname.startsWith('/peliculas')) ||
    (a !== '/' && pathname.startsWith(`${a}/`));

  return (
    <>
      <AppBar position="static" elevation={0} sx={{ bgcolor: colores.noche }}>
        <Toolbar sx={{ gap: 1, flexWrap: 'wrap' }}>
          <Typography
            variant="h6"
            component={RouterLink}
            to={esAdmin ? '/admin' : '/'}
            sx={{ color: '#fff', textDecoration: 'none', fontWeight: 700 }}
          >
            Cine<span style={{ color: colores.dorado }}>Score</span>
          </Typography>
          {esAdmin && (
            <Chip
              label="ADMIN"
              size="small"
              variant="outlined"
              sx={{ color: colores.dorado, borderColor: colores.dorado, ml: 1, fontWeight: 700 }}
            />
          )}

          <Box sx={{ flexGrow: 1 }} />

          {enlaces.map((enlace) => (
            <Button
              key={enlace.a}
              component={RouterLink}
              to={enlace.a}
              sx={{
                color: activo(enlace.a) ? colores.dorado : 'rgba(255,255,255,0.75)',
                border: activo(enlace.a) ? `1px solid ${colores.dorado}` : '1px solid transparent'
              }}
            >
              {enlace.a === '/chat' ? (
                <Badge badgeContent={noLeidos} color="primary" sx={{ '& .MuiBadge-badge': { right: -12 } }}>
                  {enlace.texto}
                </Badge>
              ) : (
                enlace.texto
              )}
            </Button>
          ))}
          <Button
            onClick={logout}
            startIcon={<LogoutIcon />}
            sx={{ color: 'rgba(255,255,255,0.75)' }}
          >
            Salir
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Outlet />
      </Container>
    </>
  );
}
