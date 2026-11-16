import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Snackbar, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { fechaCorta } from '../../utils/formato';
import Cargando from '../Cargando';
import Confirmar from '../Confirmar';

const TIPOS = { Pelicula: 'Película', Resena: 'Reseña', Comentario: 'Comentario', MensajeForo: 'Mensaje de foro' };
const FILTROS = [
  { valor: 'pendiente', texto: 'Pendientes' },
  { valor: 'revisado', texto: 'Revisados' },
  { valor: 'eliminado', texto: 'Eliminados' },
  { valor: '', texto: 'Todos' }
];

// ver cada reporte con su contenido y decidir qué hacer
export default function AdminReportes({ onCambio }) {
  const [estado, setEstado] = useState('pendiente');
  const { datos, error, cargando, recargar } = useApi(`/api/reportes${estado ? `?estado=${estado}` : ''}`);

  const [dialogo, setDialogo] = useState(null); // contenido, borrar y reporte
  const [aviso, setAviso] = useState('');

  function terminado(mensaje) {
    setDialogo(null);
    setAviso(mensaje);
    recargar();
    onCambio();
  }

  async function marcarRevisado(reporte) {
    try {
      await api.put(`/api/reportes/${reporte._id}`, { estado: 'revisado' });
      terminado('Reporte marcado como revisado');
    } catch (err) {
      setAviso(err.message);
    }
  }

  async function eliminarContenido() {
    await api.post(`/api/reportes/${dialogo.reporte._id}/eliminar-contenido`);
    terminado('Contenido eliminado');
  }

  async function borrarReporte() {
    await api.delete(`/api/reportes/${dialogo.reporte._id}`);
    terminado('Reporte borrado');
  }

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        {FILTROS.map((f) => (
          <Chip
            key={f.texto}
            label={f.texto}
            clickable
            color={estado === f.valor ? 'primary' : 'default'}
            variant={estado === f.valor ? 'filled' : 'outlined'}
            onClick={() => setEstado(f.valor)}
          />
        ))}
      </Box>

      {cargando && <Cargando />}
      {error && <Alert severity="error">{error}</Alert>}
      {datos && datos.length === 0 && <Alert severity="success">No hay reportes aquí. ¡Todo en orden!</Alert>}

      <Box sx={{ display: 'grid', gap: 2 }}>
        {datos && datos.map((r) => {
          const c = r.contenido;
          return (
            <Card key={r._id}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Chip label={TIPOS[r.tipo]} size="small" color="secondary" />
                  <Chip label={r.estado} size="small" variant="outlined" />
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    {fechaCorta(r.createdAt)}
                  </Typography>
                </Box>

                {/* el contenido reportado */}
                {c ? (
                  <Box sx={{ p: 2, bgcolor: '#faf8f3', borderRadius: 2, mb: 1.5 }}>
                    {c.titulo && <Typography sx={{ fontWeight: 700 }}>{c.titulo}</Typography>}
                    {c.texto && <Typography sx={{ whiteSpace: 'pre-wrap' }}>{c.texto}</Typography>}
                    {c.usuario && c.usuario.username && (
                      <Typography variant="caption" color="text.secondary">
                        Autor: {c.usuario.username}
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <Typography color="text.secondary" sx={{ fontStyle: 'italic', mb: 1.5 }}>
                    [contenido eliminado]
                  </Typography>
                )}

                <Typography variant="body2">
                  <strong>Motivo:</strong> {r.razon}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Reportado por {r.reportadoPor ? r.reportadoPor.username : 'usuario eliminado'}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                  {c && r.tipo === 'Pelicula' && (
                    <Button size="small" variant="outlined" component={RouterLink} to={`/peliculas/${c._id}`}>
                      Ver película
                    </Button>
                  )}
                  {r.estado === 'pendiente' && (
                    <Button size="small" variant="outlined" color="success" onClick={() => marcarRevisado(r)}>
                      Marcar revisado
                    </Button>
                  )}
                  {r.estado !== 'eliminado' && (
                    <Button size="small" variant="contained" color="error" onClick={() => setDialogo({ tipo: 'contenido', reporte: r })}>
                      Eliminar contenido
                    </Button>
                  )}
                  <Button size="small" color="inherit" onClick={() => setDialogo({ tipo: 'borrar', reporte: r })}>
                    Borrar reporte
                  </Button>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {dialogo && dialogo.tipo === 'contenido' && (
        <Confirmar
          titulo="¿Eliminar el contenido reportado?"
          texto="Se borrará el contenido y lo que dependa de él. El reporte queda como historial."
          textoBoton="Eliminar contenido"
          onCerrar={() => setDialogo(null)}
          onConfirmar={eliminarContenido}
        />
      )}
      {dialogo && dialogo.tipo === 'borrar' && (
        <Confirmar
          titulo="¿Borrar este reporte?"
          texto="Solo se borra el reporte; el contenido no se toca."
          textoBoton="Borrar reporte"
          onCerrar={() => setDialogo(null)}
          onConfirmar={borrarReporte}
        />
      )}

      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={3500}
        onClose={() => setAviso('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setAviso('')}>
          {aviso}
        </Alert>
      </Snackbar>
    </>
  );
}
