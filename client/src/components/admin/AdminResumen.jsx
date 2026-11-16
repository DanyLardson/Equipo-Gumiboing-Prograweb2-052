import { Alert, Box, Button, Card, CardContent, Paper, Typography } from '@mui/material';
import { BarrasVerticales } from '../Barras';
import Cargando from '../Cargando';
import { mesCorto } from '../../utils/formato';
import { colores } from '../../theme';

function Indicador({ etiqueta, valor, alerta = false }) {
  return (
    <Paper sx={{ p: 2.5, bgcolor: alerta ? '#2a1a1a' : colores.noche, color: '#fff' }}>
      <Typography variant="caption" sx={{ color: alerta ? '#ff8b88' : 'rgba(255,255,255,0.6)' }}>
        {etiqueta}
      </Typography>
      <Typography variant="h4" sx={{ color: alerta ? '#ff8b88' : '#fff' }}>
        {valor}
      </Typography>
    </Paper>
  );
}

// totales reales de la base y las reseñas de los últimos meses
export default function AdminResumen({ resumen, onIrAReportes }) {
  const { datos, error, cargando } = resumen;

  if (cargando) return <Cargando />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const { totales, reportesPorEstado, resenasPorMes } = datos;
  const pendientes = reportesPorEstado.pendiente;

  return (
    <>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, mb: 3 }}>
        <Indicador etiqueta="Reseñas" valor={totales.resenas} />
        <Indicador etiqueta="Foros" valor={totales.foros} />
        <Indicador etiqueta="Usuarios" valor={totales.usuarios} />
        <Indicador etiqueta="Reportes pendientes" valor={pendientes} alerta />
      </Box>

      {pendientes > 0 && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={onIrAReportes}>
              Revisar
            </Button>
          }
        >
          Hay {pendientes} {pendientes === 1 ? 'reporte' : 'reportes'} esperando revisión.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Reseñas por mes
          </Typography>
          <BarrasVerticales datos={resenasPorMes.map((m) => ({ etiqueta: mesCorto(m.mes), valor: m.total }))} />
        </CardContent>
      </Card>
    </>
  );
}
