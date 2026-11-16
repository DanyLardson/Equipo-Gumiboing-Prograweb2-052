import { Alert, Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { Link as RouterLink } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import Cargando from './Cargando';
import FilaForo from './FilaForo';

// foros de una película, dentro de su detalle
export default function ForosDePelicula({ peliculaId }) {
  const { datos, error, cargando } = useApi(`/api/foros?pelicula=${peliculaId}`);
  const foros = datos ? datos.foros : [];

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5">Foros</Typography>
        <Button
          component={RouterLink}
          to={`/foros/nuevo?pelicula=${peliculaId}`}
          variant="outlined"
          startIcon={<AddIcon />}
        >
          Crear foro
        </Button>
      </Box>

      {cargando && <Cargando />}
      {error && <Alert severity="error">{error}</Alert>}
      {!cargando && !error && foros.length === 0 && (
        <Alert severity="info">Todavía no hay foros de esta película.</Alert>
      )}

      <Box sx={{ display: 'grid', gap: 1.5 }}>
        {foros.map((f) => (
          <FilaForo key={f._id} foro={f} mostrarPelicula={false} />
        ))}
      </Box>
    </>
  );
}
