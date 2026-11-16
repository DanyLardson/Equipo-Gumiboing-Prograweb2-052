import { useState } from 'react';
import { Alert, Box, Button, Chip, InputAdornment, MenuItem, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Cargando from '../components/Cargando';
import FilaForo from '../components/FilaForo';

const ORDENES = [
  { valor: 'recientes', texto: 'Más recientes' },
  { valor: 'respuestas', texto: 'Más respuestas' },
  { valor: 'titulo', texto: 'Título (A-Z)' }
];

// el backend ya los manda del más reciente al más viejo
function ordenar(lista, orden) {
  const copia = [...lista];
  if (orden === 'respuestas') return copia.sort((a, b) => b.respuestas - a.respuestas);
  if (orden === 'titulo') return copia.sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
  return copia;
}

export default function Foros() {
  const [params, setParams] = useSearchParams();
  const peliculaId = params.get('pelicula') || '';
  const { datos, error, cargando } = useApi(peliculaId ? `/api/foros?pelicula=${peliculaId}` : '/api/foros');

  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('recientes');

  const texto = busqueda.trim().toLowerCase();
  const foros = datos
    ? ordenar(datos.foros, orden).filter((f) =>
        !texto ||
        f.titulo.toLowerCase().includes(texto) ||
        (f.pelicula && f.pelicula.titulo.toLowerCase().includes(texto)) ||
        (f.creadoPor && f.creadoPor.username.toLowerCase().includes(texto))
      )
    : [];

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4">Foros</Typography>
          <Typography color="text.secondary">Conversa sobre tus películas favoritas.</Typography>
        </Box>
        <Button
          component={RouterLink}
          to={peliculaId ? `/foros/nuevo?pelicula=${peliculaId}` : '/foros/nuevo'}
          variant="contained"
          startIcon={<AddIcon />}
        >
          Crear foro
        </Button>
      </Box>

      {/* filtro por película cuando se llega desde el detalle */}
      {datos && datos.pelicula && (
        <Chip
          label={`Película: ${datos.pelicula.titulo} (${datos.pelicula.anio})`}
          onDelete={() => setParams({})}
          color="secondary"
          sx={{ mb: 2 }}
        />
      )}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
        <TextField
          placeholder="Buscar por título, película o autor..."
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

      {cargando && <Cargando />}
      {error && <Alert severity="error">{error}</Alert>}

      {!cargando && !error && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {foros.length} {foros.length === 1 ? 'foro' : 'foros'}
          </Typography>

          {foros.length === 0 ? (
            <Alert severity="info">
              {busqueda ? 'No encontramos foros con esa búsqueda.' : 'Todavía no hay foros. ¡Crea el primero!'}
            </Alert>
          ) : (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {foros.map((f) => (
                <FilaForo key={f._id} foro={f} />
              ))}
            </Box>
          )}
        </>
      )}
    </>
  );
}
