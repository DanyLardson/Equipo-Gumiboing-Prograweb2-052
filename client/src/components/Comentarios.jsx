import { useState } from 'react';
import { Alert, Avatar, Box, Button, IconButton, Snackbar, TextField, Tooltip, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { errorTexto } from '../utils/validar';
import { fechaCorta } from '../utils/formato';
import Confirmar from './Confirmar';
import DialogoReportar from './DialogoReportar';

// Comentarios de una reseña: lista, y permite comentar, dar like, editar, eliminar y reportar
export default function Comentarios({ resenaId, onCambio }) {
  const { usuario, esAdmin } = useAuth();
  const { datos, error, cargando, recargar } = useApi(`/api/comentarios?resena=${resenaId}`);

  const [texto, setTexto] = useState('');
  const [errorNuevo, setErrorNuevo] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [editando, setEditando] = useState(null); // { id, texto }
  const [errorEdicion, setErrorEdicion] = useState('');
  const [aEliminar, setAEliminar] = useState(null);
  const [aReportar, setAReportar] = useState(null);
  const [aviso, setAviso] = useState('');

  function cambio() {
    recargar();
    onCambio();
  }

  async function comentar(evento) {
    evento.preventDefault();
    const e = errorTexto(texto, { etiqueta: 'El comentario', max: 500, obligatorio: true });
    setErrorNuevo(e);
    if (e) return;

    try {
      setEnviando(true);
      await api.post('/api/comentarios', { resena: resenaId, texto: texto.trim() });
      setTexto('');
      cambio();
    } catch (err) {
      setErrorNuevo(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function darLike(id) {
    try {
      await api.post(`/api/comentarios/${id}/like`);
      recargar();
    } catch (err) {
      setAviso(err.message);
    }
  }

  async function guardarEdicion() {
    const e = errorTexto(editando.texto, { etiqueta: 'El comentario', max: 500, obligatorio: true });
    setErrorEdicion(e);
    if (e) return;

    try {
      await api.put(`/api/comentarios/${editando.id}`, { texto: editando.texto.trim() });
      setEditando(null);
      recargar();
    } catch (err) {
      setErrorEdicion(err.message);
    }
  }

  async function eliminar() {
    await api.delete(`/api/comentarios/${aEliminar}`);
    setAEliminar(null);
    cambio();
  }

  return (
    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #eeeae0' }}>
      {cargando && <Typography variant="body2" color="text.secondary">Cargando comentarios...</Typography>}
      {error && <Alert severity="error">{error}</Alert>}

      {datos && datos.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Todavía no hay comentarios. ¡Sé el primero!
        </Typography>
      )}

      {datos && datos.map((c) => {
        const esMio = c.usuario && c.usuario._id === usuario._id;
        return (
          <Box key={c._id} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
            <Avatar src={c.usuario?.avatar || undefined} sx={{ width: 32, height: 32, fontSize: 14 }}>
              {c.usuario ? c.usuario.username[0].toUpperCase() : '?'}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="body2">
                <strong>{c.usuario ? c.usuario.username : 'Usuario eliminado'}</strong>{' '}
                <Typography component="span" variant="caption" color="text.secondary">
                  {fechaCorta(c.createdAt)}
                </Typography>
              </Typography>

              {editando && editando.id === c._id ? (
                <Box sx={{ mt: 1 }}>
                  <TextField
                    value={editando.texto}
                    onChange={(e) => setEditando({ ...editando, texto: e.target.value })}
                    error={Boolean(errorEdicion)}
                    helperText={errorEdicion}
                    size="small"
                    multiline
                    fullWidth
                    autoFocus
                  />
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button size="small" variant="contained" onClick={guardarEdicion}>
                      Guardar
                    </Button>
                    <Button size="small" onClick={() => setEditando(null)}>
                      Cancelar
                    </Button>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {c.texto}
                </Typography>
              )}

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Button
                  size="small"
                  color={c.yoLeDiLike ? 'primary' : 'inherit'}
                  startIcon={c.yoLeDiLike ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                  onClick={() => darLike(c._id)}
                  sx={{ minWidth: 0 }}
                >
                  {c.likes}
                </Button>
                {esMio && (
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={() => { setErrorEdicion(''); setEditando({ id: c._id, texto: c.texto }); }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {(esMio || esAdmin) && (
                  <Tooltip title="Eliminar">
                    <IconButton size="small" onClick={() => setAEliminar(c._id)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                {!esMio && (
                  <Tooltip title="Reportar">
                    <IconButton size="small" onClick={() => setAReportar(c._id)}>
                      <FlagOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </Box>
        );
      })}

      {/* nuebo comentariow */}
      <Box component="form" onSubmit={comentar} noValidate sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          placeholder="Escribe un comentario..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          error={Boolean(errorNuevo)}
          helperText={errorNuevo}
          size="small"
          fullWidth
        />
        <Button type="submit" variant="contained" disabled={enviando}>
          Comentar
        </Button>
      </Box>

      {aEliminar && (
        <Confirmar
          titulo="¿Eliminar comentario?"
          texto="Esta acción no se puede deshacer."
          onCerrar={() => setAEliminar(null)}
          onConfirmar={eliminar}
        />
      )}
      {aReportar && (
        <DialogoReportar
          tipo="Comentario"
          contenido={aReportar}
          onCerrar={() => setAReportar(null)}
          onReportado={() => {
            setAReportar(null);
            setAviso('Reporte enviado. Gracias por avisar.');
          }}
        />
      )}
      <Snackbar
        open={Boolean(aviso)}
        autoHideDuration={3500}
        onClose={() => setAviso('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" variant="filled" onClose={() => setAviso('')}>
          {aviso}
        </Alert>
      </Snackbar>
    </Box>
  );
}
