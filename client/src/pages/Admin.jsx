import { Alert, Box, Paper, Typography } from '@mui/material';
import { useApi } from '../hooks/useApi';
import Cargando from '../components/Cargando';
import { colores } from '../theme';

function Indicador({ etiqueta, valor, alerta = false }) {
  return (
    <Paper
      sx={{
        p: 2.5,
        bgcolor: alerta ? '#2a1a1a' : '#1d1d2b',
        color: '#fff',
        border: alerta ? `1px solid ${colores.rojo}55` : 'none'
      }}
    >
      <Typography variant="caption" sx={{ color: alerta ? '#ff8b88' : 'rgba(255,255,255,0.6)' }}>
        {etiqueta}
      </Typography>
      <Typography variant="h4" sx={{ color: alerta ? '#ff8b88' : '#fff' }}>
        {valor}
      </Typography>
    </Paper>
  );
}

// Las tablas de reportes y las 4 consultas
export default function Admin() {
  const { datos, error, cargando } = useApi('/api/estadisticas/resumen');

  if (cargando) return <Cargando />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const { totales, reportesPorEstado } = datos;

  return (
    <>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Panel de administración
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 2
        }}
      >
        <Indicador etiqueta="Reseñas" valor={totales.resenas} />
        <Indicador etiqueta="Foros" valor={totales.foros} />
        <Indicador etiqueta="Usuarios" valor={totales.usuarios} />
        <Indicador etiqueta="Reportes pendientes" valor={reportesPorEstado.pendiente} alerta />
      </Box>

      <Alert severity="info" sx={{ mt: 4 }}>
        Aquí irán la moderación de reportes y las consultas de estadísticas (Fase 5).
      </Alert>
    </>
  );
}
