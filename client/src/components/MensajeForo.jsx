import { useState } from 'react';
import { Alert, Avatar, Box, Button, Card, CardContent, IconButton, Snackbar, TextField, Tooltip, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { errorTexto } from '../utils/validar';
import { fechaCorta } from '../utils/formato';
import Confirmar from './Confirmar';
import DialogoReportar from './DialogoReportar';

// un mensaje del foro con like, editar, eliminar y reportar
export default function MensajeForo({ mensaje, onCambio }) {
  const { usuario, esAdmin } = useAuth();
  const esMio = mensaje.usuario && mensaje.usuario._id === usuario._id;

  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(mensaje.texto);
  const [errorEdicion, setErrorEdicion] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [dialogo, setDialogo] = useState(null); // 'eliminar' y 'reportar'
  const [aviso, setAviso] = useState('');

  async function darLike() {
    try {
      await api.post(`/api/foros/mensajes/${mensaje._id}/like`);
      onCambio();
    } catch (err) {
      setAviso(err.message);
    }
  }

  async function guardar() {
    const e = errorTexto(texto, { etiqueta: 'El mensaje', max: 1000, obligatorio: true });
    setErrorEdicion(e);
    if (e) return;

    try {
      setGuardando(true);
      await api.put(`/api/foros/mensajes/${mensaje._id}`, { texto: texto.trim() });
      setEditando(false);
      onCambio();
    } catch (err) {
      setErrorEdicion(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    await api.delete(`/api/foros/mensajes/${mensaje._id}`);
    setDialogo(null);
    onCambio();
  }

  return (
    <Card>
      <CardContent sx={{ display: 'flex', gap: 2 }}>
        <Avatar src={mensaje.usuario?.avatar || undefined}>
          {mensaje.usuario ? mensaje.usuario.username[0].toUpperCase() : '?'}
        </Avatar>

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600 }}>
            {mensaje.usuario ? mensaje.usuario.username : 'Usuario eliminado'}{' '}
            <Typography component="span" variant="caption" color="text.secondary">
              {fechaCorta(mensaje.createdAt)}
            </Typography>
          </Typography>

          {editando ? (
            <Box sx={{ mt: 1 }}>
              <TextField
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                error={Boolean(errorEdicion)}
                helperText={errorEdicion || `${texto.trim().length}/1000`}
                multiline
                fullWidth
                autoFocus
              />
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button size="small" variant="contained" onClick={guardar} disabled={guardando}>
                  Guardar
                </Button>
                <Button
                  size="small"
                  disabled={guardando}
                  onClick={() => {
                    setEditando(false);
                    setTexto(mensaje.texto);
                    setErrorEdicion('');
                  }}
                >
                  Cancelar
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{mensaje.texto}</Typography>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            <Button
              size="small"
              color={mensaje.yoLeDiLike ? 'primary' : 'inherit'}
              startIcon={mensaje.yoLeDiLike ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              onClick={darLike}
            >
              {mensaje.likes}
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            {esMio && !editando && (
              <Tooltip title="Editar">
                <IconButton size="small" onClick={() => setEditando(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {(esMio || esAdmin) && (
              <Tooltip title="Eliminar">
                <IconButton size="small" onClick={() => setDialogo('eliminar')}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {!esMio && (
              <Tooltip title="Reportar">
                <IconButton size="small" onClick={() => setDialogo('reportar')}>
                  <FlagOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </CardContent>

      {dialogo === 'eliminar' && (
        <Confirmar
          titulo="¿Eliminar mensaje?"
          texto="Esta acción no se puede deshacer."
          onCerrar={() => setDialogo(null)}
          onConfirmar={eliminar}
        />
      )}
      {dialogo === 'reportar' && (
        <DialogoReportar
          tipo="MensajeForo"
          contenido={mensaje._id}
          onCerrar={() => setDialogo(null)}
          onReportado={() => {
            setDialogo(null);
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
    </Card>
  );
}
