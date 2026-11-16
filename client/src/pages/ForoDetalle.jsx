import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, Chip, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MovieIcon from '@mui/icons-material/Movie';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { errorTexto } from '../utils/validar';
import { fechaCorta } from '../utils/formato';
import Cargando from '../components/Cargando';
import Confirmar from '../components/Confirmar';
import MensajeForo from '../components/MensajeForo';

export default function ForoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { usuario, esAdmin } = useAuth();
  const { datos, error, cargando, recargar } = useApi(`/api/foros/${id}`);

  const [eliminando, setEliminando] = useState(false);
  const [texto, setTexto] = useState('');
  const [errorTextoNuevo, setErrorTextoNuevo] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function responder(evento) {
    evento.preventDefault();
    const e = errorTexto(texto, { etiqueta: 'El mensaje', max: 1000, obligatorio: true });
    setErrorTextoNuevo(e);
    if (e) return;

    try {
      setEnviando(true);
      await api.post(`/api/foros/${id}/mensajes`, { texto: texto.trim() });
      setTexto('');
      recargar();
    } catch (err) {
      setErrorTextoNuevo(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function eliminarForo() {
    await api.delete(`/api/foros/${id}`);
    navigate('/foros', { replace: true });
  }

  if (cargando) return <Cargando />;
  if (error) {
    return (
      <>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button component={RouterLink} to="/foros" startIcon={<ArrowBackIcon />}>
          Volver a foros
        </Button>
      </>
    );
  }

  const { foro, mensajes } = datos;
  const puedeEditar = esAdmin || (foro.creadoPor && foro.creadoPor._id === usuario._id);

  return (
    <>
      <Button component={RouterLink} to="/foros" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Volver a foros
      </Button>

      {/* encabezado del foro */}
      <Card sx={{ mb: 4 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h4">{foro.titulo}</Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', my: 1.5 }}>
            {foro.pelicula && (
              <Chip
                icon={<MovieIcon />}
                label={`${foro.pelicula.titulo} (${foro.pelicula.anio})`}
                component={RouterLink}
                to={`/peliculas/${foro.pelicula._id}`}
                clickable
                color="secondary"
                size="small"
              />
            )}
            <Chip
              label={`por ${foro.creadoPor ? foro.creadoPor.username : 'usuario eliminado'}`}
              size="small"
              variant="outlined"
            />
            <Chip label={fechaCorta(foro.createdAt)} size="small" variant="outlined" />
          </Box>

          {foro.descripcion && (
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{foro.descripcion}</Typography>
          )}

          {puedeEditar && (
            <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
              <Button variant="outlined" startIcon={<EditIcon />} component={RouterLink} to={`/foros/${id}/editar`}>
                Editar
              </Button>
              <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => setEliminando(true)}>
                Eliminar
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* mensajes */}
      <Typography variant="h5" sx={{ mb: 2 }}>
        Mensajes ({mensajes.length})
      </Typography>

      {mensajes.length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Todavía no hay mensajes. ¡Sé el primero en responder!
        </Alert>
      )}

      <Box sx={{ display: 'grid', gap: 2, mb: 3 }}>
        {mensajes.map((m) => (
          <MensajeForo key={m._id} mensaje={m} onCambio={recargar} />
        ))}
      </Box>

      {/* responder */}
      <Card>
        <CardContent>
          <Box component="form" onSubmit={responder} noValidate sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Escribe tu mensaje"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              error={Boolean(errorTextoNuevo)}
              helperText={errorTextoNuevo || `${texto.trim().length}/1000`}
              multiline
              minRows={3}
              fullWidth
            />
            <Box>
              <Button type="submit" variant="contained" disabled={enviando}>
                {enviando ? 'Enviando...' : 'Responder'}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {eliminando && (
        <Confirmar
          titulo="¿Eliminar este foro?"
          texto="Se borrarán también todos sus mensajes. Esta acción no se puede deshacer."
          onCerrar={() => setEliminando(false)}
          onConfirmar={eliminarForo}
        />
      )}
    </>
  );
}
