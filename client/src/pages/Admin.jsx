import { useState } from 'react';
import { Tab, Tabs, Typography } from '@mui/material';
import { useApi } from '../hooks/useApi';
import AdminEstadisticas from '../components/admin/AdminEstadisticas';
import AdminReportes from '../components/admin/AdminReportes';
import AdminResumen from '../components/admin/AdminResumen';
import AdminUsuarios from '../components/admin/AdminUsuarios';

// panel del admin: resumen, moderación de reportes, estadísticas y usuarios
export default function Admin() {
  const [pestana, setPestana] = useState(0);

  // el resumen se comparte para mostrar los pendientes en la pestaña de reportes
  const resumen = useApi('/api/estadisticas/resumen');
  const pendientes = resumen.datos ? resumen.datos.reportesPorEstado.pendiente : 0;

  return (
    <>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Panel de administración
      </Typography>

      <Tabs
        value={pestana}
        onChange={(e, valor) => setPestana(valor)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3, borderBottom: '1px solid #e6e2d8' }}
      >
        <Tab label="Resumen" />
        <Tab label={`Reportes${pendientes ? ` (${pendientes})` : ''}`} />
        <Tab label="Estadísticas" />
        <Tab label="Usuarios" />
      </Tabs>

      {pestana === 0 && <AdminResumen resumen={resumen} onIrAReportes={() => setPestana(1)} />}
      {pestana === 1 && <AdminReportes onCambio={resumen.recargar} />}
      {pestana === 2 && <AdminEstadisticas />}
      {pestana === 3 && <AdminUsuarios onCambio={resumen.recargar} />}
    </>
  );
}
