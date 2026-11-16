import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Card, CardActionArea, CardContent, Chip, InputAdornment, MenuItem,
  Rating, TextField, Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { Link as RouterLink, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { GENEROS } from '../utils/constantes';
import Cargando from '../components/Cargando';
import Poster from '../components/Poster';

const ORDENES = [
  { valor: 'recientes', texto: 'Más recientes' },
  { valor: 'mejor', texto: 'Mejor calificadas' },
  { valor: 'resenas', texto: 'Más reseñadas' },
  { valor: 'anio', texto: 'Año (más nuevas)' },
  { valor: 'titulo', texto: 'Título (A-Z)' }
];

// el backend devuelve las películas más recientes primero; el resto de órdenes se hace aquí
function ordenar(lista, orden) {
  const copia = [...lista];
  switch (orden) {
    case 'mejor':
      return copia.sort(
        (a, b) =>
          (b.promedioCalificacion || 0) - (a.promedioCalificacion || 0) ||
          (b.totalResenas || 0) - (a.totalResenas || 0)
      );
    case 'resenas':
      return copia.sort((a, b) => (b.totalResenas || 0) - (a.totalResenas || 0));
    case 'anio':
      return copia.sort((a, b) => b.anio - a.anio);
    case 'titulo':
      return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    default:
      return copia;
  }
}

function TarjetaPelicula({ pelicula: p }) {
  return (
    <Card>
      <CardActionArea component={RouterLink} to={`/peliculas/${p._id}`}>
        <Poster src={p.poster} alt={p.titulo} alto={260} />
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {p.titulo}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {p.anio} · {p.genero}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Rating value={p.promedioCalificacion || 0} precision={0.5} readOnly size="small" />
            <Typography variant="caption" color="text.secondary">
              {p.totalResenas ? `${p.promedioCalificacion} (${p.totalResenas})` : 'Sin reseñas'}
            </Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

function Catalogo() {
  const [busqueda, setBusqueda] = useState('');
  const [q, setQ] = useState('');
  const [genero, setGenero] = useState('Todos');
  const [orden, setOrden] = useState('recientes');

  // Se espera un momento después de dejar de escribir para no pedir datos en cada letra
  useEffect(() => {
    const espera = setTimeout(() => setQ(busqueda.trim()), 350);
    return () => clearTimeout(espera);
  }, [busqueda]);

  const ruta = `/api/peliculas?genero=${encodeURIComponent(genero)}&q=${encodeURIComponent(q)}`;
  const { datos, error, cargando } = useApi(ruta);

  const hayFiltros = busqueda !== '' || genero !== 'Todos';
  function limpiar() {
    setBusqueda('');
    setQ('');
    setGenero('Todos');
  }

  const peliculas = datos ? ordenar(datos, orden) : [];

  return (
    <>
      {/* búsqueda y orden */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          placeholder="Buscar por título..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          size="small"
          sx={{ flex: '1 1 260px' }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }
          }}
        />
        <TextField
          select
          label="Ordenar por"
          value={orden}
          onChange={(e) => setOrden(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        >
          {ORDENES.map((o) => (
            <MenuItem key={o.valor} value={o.valor}>
              {o.texto}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* filtro por género */}
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {['Todos', ...GENEROS].map((g) => (
          <Chip
            key={g}
            label={g}
            clickable
            color={genero === g ? 'primary' : 'default'}
            variant={genero === g ? 'filled' : 'outlined'}
            onClick={() => setGenero(g)}
          />
        ))}
      </Box>

      {cargando && <Cargando />}
      {error && <Alert severity="error">{error}</Alert>}

      {!cargando && !error && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {peliculas.length} {peliculas.length === 1 ? 'película' : 'películas'}
          </Typography>

          {peliculas.length === 0 ? (
            <Alert
              severity="info"
              action={
                hayFiltros && (
                  <Button color="inherit" size="small" onClick={limpiar}>
                    Limpiar filtros
                  </Button>
                )
              }
            >
              {hayFiltros ? 'No encontramos películas con esos filtros.' : 'Todavía no hay películas.'}
            </Alert>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 3
              }}
            >
              {peliculas.map((p) => (
                <TarjetaPelicula key={p._id} pelicula={p} />
              ))}
            </Box>
          )}
        </>
      )}
    </>
  );
}

export default function Explorar() {
  const { esAdmin, usuario } = useAuth();

  // el admin no usa esta pantalla, él va directo a su panel
  if (esAdmin) return <Navigate to="/admin" replace />;

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4">Explorar</Typography>
          <Typography color="text.secondary">
            Hola, {usuario.username}. Encuentra tu próxima película.
          </Typography>
        </Box>
        <Button component={RouterLink} to="/peliculas/nueva" variant="contained" startIcon={<AddIcon />}>
          Agregar película
        </Button>
      </Box>
      <Catalogo />
    </>
  );
}
