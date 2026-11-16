import { AppBar, Box, Button, Chip, Container, Toolbar, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { colores } from '../theme';

// menú según el rol (el admin solo ve el panel y su perfil)
const ENLACES_USUARIO = [
  { a: '/', texto: 'Explorar' },
  { a: '/perfil', texto: 'Perfil' }
];
const ENLACES_ADMIN = [
  { a: '/admin', texto: 'Panel admin' },
  { a: '/perfil', texto: 'Perfil' }
];

export default function Layout() {
  const { esAdmin, logout } = useAuth();
  const { pathname } = useLocation();
  const enlaces = esAdmin ? ENLACES_ADMIN : ENLACES_USUARIO;

  // "Explorar" también queda marcado dentro del detalle y los formularios de película
  const activo = (a) => pathname === a || (a === '/' && pathname.startsWith('/peliculas'));

  return (
    <>
      <AppBar position="static" elevation={0} sx={{ bgcolor: colores.noche }}>
        <Toolbar sx={{ gap: 1 }}>
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
              {enlace.texto}
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
