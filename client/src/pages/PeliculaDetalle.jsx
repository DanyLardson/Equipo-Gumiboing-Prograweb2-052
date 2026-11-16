import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, Rating, Snackbar, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import RateReviewIcon from '@mui/icons-material/RateReview';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import Cargando from '../components/Cargando';
import Poster from '../components/Poster';
import Confirmar from '../components/Confirmar';
import DialogoReportar from '../components/DialogoReportar';
import DialogoResena from '../components/DialogoResena';
import ForosDePelicula from '../components/ForosDePelicula';
import TarjetaResena from '../components/TarjetaResena';

export default function PeliculaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, esAdmin } = useAuth();

  const pelicula = useApi(`/api/peliculas/${id}`);
  const resenas = useApi(`/api/resenas?pelicula=${id}`);

  const [dialogo, setDialogo] = useState(null); // 'resena' | 'eliminar' | 'reportar' | null
  const [aviso, setAviso] = useState('');

  // Cuando cambia una reseña o un comentario cambia también el promedio de la película
  function alCambiar() {
    resenas.recargar();
    pelicula.recargar();
  }

  async function eliminarPelicula() {
    await api.delete(`/api/peliculas/${id}`);
    navigate('/', { replace: true });
  }

  if (pelicula.cargando) return <Cargando />;
  if (pelicula.error) {
    return (
      <>
        <Alert severity="error" sx={{ mb: 2 }}>
          {pelicula.error}
        </Alert>
        <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />}>
          Volver a explorar
        </Button>
      </>
    );
  }

  const p = pelicula.datos;
  const esCreador = String(p.creadoPor) === usuario._id;
  const puedeEditar = esAdmin || esCreador;
  const lista = resenas.datos || [];
  const miResena = lista.find((r) => r.usuario && r.usuario._id === usuario._id);

  return (
    <>
      <Button component={RouterLink} to="/" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Volver a explorar
      </Button>

      {/* Datos de la película */}
      <Card sx={{ mb: 4 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '260px 1fr' } }}>
          <Poster src={p.poster} alt={p.titulo} alto={380} />
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h4">{p.titulo}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1.5 }}>
              <Chip label={p.anio} size="small" />
              <Chip label={p.genero} size="small" color="secondary" />
              <Chip label={`Dir. ${p.director}`} size="small" variant="outlined" />
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Rating value={p.promedioCalificacion || 0} precision={0.5} readOnly />
              <Typography color="text.secondary">
                {p.totalResenas
                  ? `${p.promedioCalificacion} · ${p.totalResenas} ${p.totalResenas === 1 ? 'reseña' : 'reseñas'}`
                  : 'Sin reseñas todavía'}
              </Typography>
            </Box>

            <Typography sx={{ whiteSpace: 'pre-wrap' }}>
              {p.sinopsis || 'Esta película todavía no tiene sinopsis.'}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 3 }}>
              {!miResena && !esAdmin && (
                <Button variant="contained" startIcon={<RateReviewIcon />} onClick={() => setDialogo('resena')}>
                  Escribir reseña
                </Button>
              )}
              {!esCreador && !esAdmin && (
                <Button variant="outlined" color="inherit" startIcon={<FlagOutlinedIcon />} onClick={() => setDialogo('reportar')}>
                  Reportar
                </Button>
              )}
              {puedeEditar && (
                <>
                  <Button variant="outlined" startIcon={<EditIcon />} component={RouterLink} to={`/peliculas/${id}/editar`}>
                    Editar
                  </Button>
                  <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => setDialogo('eliminar')}>
                    Eliminar
                  </Button>
                </>
              )}
            </Box>
          </CardContent>
        </Box>
      </Card>

      {/* Reseñas */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Reseñas
      </Typography>

      {resenas.cargando && <Cargando />}
      {resenas.error && <Alert severity="error">{resenas.error}</Alert>}
      {!resenas.cargando && !resenas.error && lista.length === 0 && (
        <Alert severity="info">Todavía nadie ha reseñado esta película. ¡Sé el primero!</Alert>
      )}

      <Box sx={{ display: 'grid', gap: 2 }}>
        {lista.map((r) => (
          <TarjetaResena key={r._id} resena={r} peliculaId={id} onCambio={alCambiar} />
        ))}
      </Box>

      {/* foros de la película */}
      <Box sx={{ mt: 5 }}>
        <ForosDePelicula peliculaId={id} />
      </Box>

      {dialogo === 'resena' && (
        <DialogoResena
          peliculaId={id}
          resena={null}
          onCerrar={() => setDialogo(null)}
          onGuardada={(mensaje) => {
            setDialogo(null);
            setAviso(mensaje);
            alCambiar();
          }}
        />
      )}
      {dialogo === 'reportar' && (
        <DialogoReportar
          tipo="Pelicula"
          contenido={id}
          onCerrar={() => setDialogo(null)}
          onReportado={() => {
            setDialogo(null);
            setAviso('Reporte enviado. Un administrador lo revisará.');
          }}
        />
      )}
      {dialogo === 'eliminar' && (
        <Confirmar
          titulo="¿Eliminar esta película?"
          texto="Se borrarán también todas sus reseñas, comentarios y foros. Esta acción no se puede deshacer."
          onCerrar={() => setDialogo(null)}
          onConfirmar={eliminarPelicula}
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
