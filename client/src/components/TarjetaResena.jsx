import { useState } from 'react';
import { Alert, Avatar, Box, Button, Card, CardContent, IconButton, Rating, Snackbar, Tooltip, Typography } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { fechaCorta } from '../utils/formato';
import Comentarios from './Comentarios';
import Confirmar from './Confirmar';
import DialogoReportar from './DialogoReportar';
import DialogoResena from './DialogoResena';

// Una reseña con sus acciones: like, comentarios, editar, eliminar y reportar.
// onCambio avisa a la pantalla que debe volver a pedir las reseñas y la película (cambia el promedio).
export default function TarjetaResena({ resena, peliculaId, onCambio }) {
  const { usuario, esAdmin } = useAuth();
  const esMia = resena.usuario && resena.usuario._id === usuario._id;

  const [verComentarios, setVerComentarios] = useState(false);
  const [dialogo, setDialogo] = useState(null); // 'editar' | 'eliminar' | 'reportar'
  const [aviso, setAviso] = useState('');

  async function darLike() {
    try {
      await api.post(`/api/resenas/${resena._id}/like`);
      onCambio();
    } catch (err) {
      setAviso(err.message);
    }
  }

  async function eliminar() {
    await api.delete(`/api/resenas/${resena._id}`);
    setDialogo(null);
    onCambio();
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar src={resena.usuario?.avatar || undefined}>
            {resena.usuario ? resena.usuario.username[0].toUpperCase() : '?'}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 600 }} noWrap>
              {resena.usuario ? resena.usuario.username : 'Usuario eliminado'}
              {esMia && (
                <Typography component="span" variant="caption" color="text.secondary">
                  {' '}
                  (tú)
                </Typography>
              )}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {fechaCorta(resena.createdAt)}
            </Typography>
          </Box>
          <Rating value={resena.calificacion} readOnly />
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {resena.titulo}
        </Typography>
        <Typography sx={{ whiteSpace: 'pre-wrap', mb: 1.5 }}>{resena.texto}</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Button
            size="small"
            color={resena.yoLeDiLike ? 'primary' : 'inherit'}
            startIcon={resena.yoLeDiLike ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            onClick={darLike}
          >
            {resena.likes}
          </Button>
          <Button
            size="small"
            color="inherit"
            startIcon={<ChatBubbleOutlineIcon />}
            onClick={() => setVerComentarios(!verComentarios)}
          >
            {resena.comentarios} {resena.comentarios === 1 ? 'comentario' : 'comentarios'}
          </Button>

          <Box sx={{ flexGrow: 1 }} />

          {esMia && (
            <Tooltip title="Editar mi reseña">
              <IconButton size="small" onClick={() => setDialogo('editar')}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {(esMia || esAdmin) && (
            <Tooltip title="Eliminar">
              <IconButton size="small" onClick={() => setDialogo('eliminar')}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {!esMia && (
            <Tooltip title="Reportar">
              <IconButton size="small" onClick={() => setDialogo('reportar')}>
                <FlagOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {verComentarios && <Comentarios resenaId={resena._id} onCambio={onCambio} />}
      </CardContent>

      {dialogo === 'editar' && (
        <DialogoResena
          peliculaId={peliculaId}
          resena={resena}
          onCerrar={() => setDialogo(null)}
          onGuardada={() => {
            setDialogo(null);
            onCambio();
          }}
        />
      )}
      {dialogo === 'eliminar' && (
        <Confirmar
          titulo="¿Eliminar reseña?"
          texto="Se borrarán también sus comentarios. Esta acción no se puede deshacer."
          onCerrar={() => setDialogo(null)}
          onConfirmar={eliminar}
        />
      )}
      {dialogo === 'reportar' && (
        <DialogoReportar
          tipo="Resena"
          contenido={resena._id}
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
