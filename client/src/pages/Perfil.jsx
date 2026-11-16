import { useState } from 'react';
import {
  Alert, Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Rating, Snackbar, TextField, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RateReviewIcon from '@mui/icons-material/RateReview';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { errorAvatar, errorBio, errorEmail, errorPassword, errorUsername } from '../utils/validar';
import Cargando from '../components/Cargando';
import Poster from '../components/Poster';
import { colores } from '../theme';
import { Link } from 'react-router-dom'; 


// Diálogos
function DialogoEditar({ usuario, onCerrar, onGuardado }) {
  const [form, setForm] = useState({
    username: usuario.username,
    email: usuario.email,
    bio: usuario.bio || '',
    avatar: usuario.avatar || ''
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function guardar(evento) {
    evento.preventDefault();
    setErrorServidor('');

    const nuevos = {};
    const eUser = errorUsername(form.username);
    const eMail = errorEmail(form.email);
    const eBio = errorBio(form.bio);
    const eAvatar = errorAvatar(form.avatar);
    if (eUser) nuevos.username = eUser;
    if (eMail) nuevos.email = eMail;
    if (eBio) nuevos.bio = eBio;
    if (eAvatar) nuevos.avatar = eAvatar;
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    try {
      setEnviando(true);
      const actualizado = await api.put('/api/usuarios/me', {
        username: form.username.trim(),
        email: form.email.trim(),
        bio: form.bio.trim(),
        avatar: form.avatar.trim()
      });
      onGuardado(actualizado);
    } catch (err) {
      setErrorServidor(err.message);
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : onCerrar} fullWidth maxWidth="sm">
      <DialogTitle>Editar perfil</DialogTitle>
      <DialogContent>
        {errorServidor && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorServidor}
          </Alert>
        )}
        <Box id="form-editar" component="form" onSubmit={guardar} noValidate sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField
            label="Nombre de usuario"
            value={form.username}
            onChange={cambiar('username')}
            error={Boolean(errores.username)}
            helperText={errores.username}
            fullWidth
          />
          <TextField
            label="Correo"
            type="email"
            value={form.email}
            onChange={cambiar('email')}
            error={Boolean(errores.email)}
            helperText={errores.email}
            fullWidth
          />
          <TextField
            label="Foto de perfil (URL, opcional)"
            value={form.avatar}
            onChange={cambiar('avatar')}
            error={Boolean(errores.avatar)}
            helperText={errores.avatar}
            fullWidth
          />
          <TextField
            label="Sobre mí"
            value={form.bio}
            onChange={cambiar('bio')}
            error={Boolean(errores.bio)}
            helperText={errores.bio || `${form.bio.trim().length}/300`}
            multiline
            minRows={3}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" form="form-editar" variant="contained" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DialogoPassword({ onCerrar, onGuardado }) {
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  async function guardar(evento) {
    evento.preventDefault();
    setErrorServidor('');

    const nuevos = {};
    if (!form.actual) nuevos.actual = 'Escribe tu contraseña actual';
    const ePass = errorPassword(form.nueva);
    if (ePass) nuevos.nueva = ePass;
    if (form.confirmar !== form.nueva) nuevos.confirmar = 'Las contraseñas no coinciden';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    try {
      setEnviando(true);
      await api.put('/api/usuarios/me/password', {
        passwordActual: form.actual,
        passwordNueva: form.nueva
      });
      onGuardado();
    } catch (err) {
      setErrorServidor(err.message);
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : onCerrar} fullWidth maxWidth="xs">
      <DialogTitle>Cambiar contraseña</DialogTitle>
      <DialogContent>
        {errorServidor && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorServidor}
          </Alert>
        )}
        <Box id="form-password" component="form" onSubmit={guardar} noValidate sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <TextField
            label="Contraseña actual"
            type="password"
            value={form.actual}
            onChange={cambiar('actual')}
            error={Boolean(errores.actual)}
            helperText={errores.actual}
            autoComplete="current-password"
            fullWidth
          />
          <TextField
            label="Contraseña nueva"
            type="password"
            value={form.nueva}
            onChange={cambiar('nueva')}
            error={Boolean(errores.nueva)}
            helperText={errores.nueva}
            autoComplete="new-password"
            fullWidth
          />
          <TextField
            label="Confirmar contraseña nueva"
            type="password"
            value={form.confirmar}
            onChange={cambiar('confirmar')}
            error={Boolean(errores.confirmar)}
            helperText={errores.confirmar}
            autoComplete="new-password"
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" form="form-password" variant="contained" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Cambiar contraseña'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DialogoEliminar({ onCerrar, onEliminada }) {
  const [password, setPassword] = useState('');
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function eliminar(evento) {
    evento.preventDefault();
    setErrorServidor('');
    if (!password) {
      setErrorServidor('Escribe tu contraseña para confirmar');
      return;
    }

    try {
      setEnviando(true);
      await api.delete('/api/usuarios/me', { password });
      onEliminada();
    } catch (err) {
      setErrorServidor(err.message);
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : onCerrar} fullWidth maxWidth="xs">
      <DialogTitle>¿Eliminar tu cuenta?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Se borrarán para siempre tu cuenta, tus reseñas, comentarios, mensajes, foros, amistades y
          conversaciones. Esta acción no se puede deshacer.
        </DialogContentText>
        {errorServidor && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorServidor}
          </Alert>
        )}
        <Box id="form-eliminar" component="form" onSubmit={eliminar} noValidate>
          <TextField
            label="Tu contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" form="form-eliminar" variant="contained" color="error" disabled={enviando}>
          {enviando ? 'Eliminando...' : 'Eliminar mi cuenta'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Piezas de la pantalla
function Estadistica({ icono, valor, etiqueta }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: `${colores.dorado}33`,
            color: '#a8740a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icono}
        </Box>
        <Box>
          <Typography variant="h5" sx={{ lineHeight: 1 }}>
            {valor}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {etiqueta}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

function fechaCorta(fecha, opciones) {
  return fecha ? new Date(fecha).toLocaleDateString('es-MX', opciones) : '';
}


// Pantalla
export default function Perfil() {
  const { actualizarUsuario, cerrarSesionLocal } = useAuth();
  const { datos, error, cargando, recargar } = useApi('/api/usuarios/me');
  const [dialogo, setDialogo] = useState(null); // editar, password, eliminar, null
  const [aviso, setAviso] = useState('');

  if (cargando) return <Cargando />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const { usuario, stats, recientes } = datos;
  const esAdmin = usuario.rol === 'admin';
  const miembroDesde = fechaCorta(usuario.createdAt, { year: 'numeric', month: 'long' });

  // vista del admin
  if (esAdmin) {
    return (
      <Card sx={{ overflow: 'hidden' }}>
        <Box
          sx={{
            height: 120,
            background: `linear-gradient(120deg, ${colores.noche} 0%, #2a2440 60%, ${colores.dorado}55 100%)`
          }}
        />
        <CardContent sx={{ pt: 0, pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, flexWrap: 'wrap' }}>
            <Avatar
              src={usuario.avatar || undefined}
              sx={{
                width: 120,
                height: 120,
                fontSize: 48,
                mt: -7,
                border: '4px solid #fff',
                bgcolor: colores.dorado,
                color: colores.noche
              }}
            >
              {usuario.username[0].toUpperCase()}
            </Avatar>

            <Box sx={{ flexGrow: 1, mt: 1.5 }}>
              <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
                {usuario.username}
              </Typography>
              <Typography color="text.secondary">{usuario.email}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip label="Administrador" size="small" color="secondary" />
                {miembroDesde && <Chip label={`Miembro desde ${miembroDesde}`} size="small" variant="outlined" />}
              </Box>
            </Box>

            <Button component={Link} to="/admin" variant="contained" sx={{ mt: 1.5 }}>
              Ir al panel de reportes
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  function alGuardarPerfil(actualizado) {
    actualizarUsuario(actualizado);
    recargar();
    setDialogo(null);
    setAviso('Perfil actualizado');
  }

  return (
    <>
      {/* encabezado */}
      <Card sx={{ overflow: 'hidden', mb: 3 }}>
        <Box
          sx={{
            height: 120,
            background: `linear-gradient(120deg, ${colores.noche} 0%, #2a2440 60%, ${colores.dorado}55 100%)`
          }}
        />
        <CardContent sx={{ pt: 0, pb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 3, flexWrap: 'wrap', mt: -7 }}>
            <Avatar
              src={usuario.avatar || undefined}
              sx={{
                width: 120,
                height: 120,
                fontSize: 48,
                border: '4px solid #fff',
                bgcolor: colores.dorado,
                color: colores.noche
              }}
            >
              {usuario.username[0].toUpperCase()}
            </Avatar>

            <Box sx={{ flexGrow: 1, pb: 1 }}>
              <Typography variant="h4" sx={{ lineHeight: 1.1 }}>
                {usuario.username}
              </Typography>
              <Typography color="text.secondary">{usuario.email}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={esAdmin ? 'Administrador' : 'Usuario'}
                  size="small"
                  color={esAdmin ? 'secondary' : 'default'}
                />
                {miembroDesde && <Chip label={`Miembro desde ${miembroDesde}`} size="small" variant="outlined" />}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', pb: 1 }}>
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setDialogo('editar')}>
                Editar perfil
              </Button>
              <Button variant="outlined" startIcon={<LockOutlinedIcon />} onClick={() => setDialogo('password')}>
                Contraseña
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3
        }}
      >
        <Estadistica icono={<RateReviewIcon />} valor={stats.resenas} etiqueta="Reseñas escritas" />
        <Estadistica icono={<ChatBubbleOutlineIcon />} valor={stats.comentarios} etiqueta="Comentarios" />
        <Estadistica icono={<FavoriteBorderIcon />} valor={stats.likes} etiqueta="Likes recibidos" />
      </Box>

      {/* sobre mí y reseñas recientes */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' },
          gap: 3,
          alignItems: 'start',
          mb: 3
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Sobre mí
            </Typography>
            {usuario.bio ? (
              <Typography sx={{ whiteSpace: 'pre-wrap' }}>{usuario.bio}</Typography>
            ) : (
              <Typography color="text.secondary">
                Todavía no escribes nada sobre ti. Usa "Editar perfil" para agregarlo.
              </Typography>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Mis reseñas recientes
            </Typography>
            {recientes.length === 0 ? (
              <Typography color="text.secondary">Todavía no has escrito reseñas.</Typography>
            ) : (
              recientes.map((r, i) => (
                <Box
                  key={r._id}
                  sx={{
                    display: 'flex',
                    gap: 2,
                    py: 1.5,
                    borderTop: i === 0 ? 'none' : '1px solid #eeeae0'
                  }}
                >
                  <Poster
                    src={r.pelicula?.poster}
                    alt={r.pelicula?.titulo || 'Película eliminada'}
                    alto={72}
                    sx={{ width: 52, borderRadius: 1, flexShrink: 0 }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 600 }} noWrap>
                      {r.titulo}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {r.pelicula ? r.pelicula.titulo : 'Película eliminada'} · {fechaCorta(r.createdAt)}
                    </Typography>
                    <Rating value={r.calificacion} readOnly size="small" />
                  </Box>
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Zona de peligro */}
      <Card sx={{ borderColor: `${colores.rojo}66` }}>
        <CardContent
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Eliminar mi cuenta
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Borra tu cuenta y todo lo que has publicado. No se puede deshacer.
            </Typography>
          </Box>
          <Button color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={() => setDialogo('eliminar')}>
            Eliminar cuenta
          </Button>
        </CardContent>
      </Card>

      {dialogo === 'editar' && (
        <DialogoEditar usuario={usuario} onCerrar={() => setDialogo(null)} onGuardado={alGuardarPerfil} />
      )}
      {dialogo === 'password' && (
        <DialogoPassword
          onCerrar={() => setDialogo(null)}
          onGuardado={() => {
            setDialogo(null);
            setAviso('Contraseña actualizada');
          }}
        />
      )}
      {dialogo === 'eliminar' && (
        <DialogoEliminar onCerrar={() => setDialogo(null)} onEliminada={cerrarSesionLocal} />
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
