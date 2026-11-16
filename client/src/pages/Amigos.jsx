import { useEffect, useState } from 'react';
import {
  Alert, Box, Button, Chip, InputAdornment, Snackbar, Tab, Tabs, TextField, Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import Cargando from '../components/Cargando';
import Confirmar from '../components/Confirmar';
import FilaUsuario from '../components/FilaUsuario';

function Vacio({ texto }) {
  return <Alert severity="info">{texto}</Alert>;
}

export default function Amigos() {
  const navigate = useNavigate();
  const [pestana, setPestana] = useState(0);
  const [aviso, setAviso] = useState({ texto: '', tipo: 'success' });
  const [aQuitar, setAQuitar] = useState(null); // { amistadId, username }

  // buscador con espera para no pedir datos en cada letra
  const [busqueda, setBusqueda] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const espera = setTimeout(() => setQ(busqueda.trim()), 350);
    return () => clearTimeout(espera);
  }, [busqueda]);

  const amistades = useApi('/api/amigos');
  const personas = useApi(`/api/amigos/buscar?q=${encodeURIComponent(q)}`);

  function recargarTodo() {
    amistades.recargar();
    personas.recargar();
  }

  // ejecuta una acción y avisa el resultado
  async function ejecutar(accion, mensajeOk) {
    try {
      await accion();
      if (mensajeOk) setAviso({ texto: mensajeOk, tipo: 'success' });
      recargarTodo();
    } catch (err) {
      setAviso({ texto: err.message, tipo: 'error' });
    }
  }

  const enviar = (id) => ejecutar(() => api.post('/api/amigos', { destinatario: id }), 'Solicitud enviada');
  const responder = (amistadId, estado) =>
    ejecutar(
      () => api.put(`/api/amigos/${amistadId}`, { estado }),
      estado === 'aceptada' ? 'Ahora son amigos' : 'Solicitud rechazada'
    );
  const cancelar = (amistadId) => ejecutar(() => api.delete(`/api/amigos/${amistadId}`), 'Solicitud cancelada');

  async function quitarAmigo() {
    await api.delete(`/api/amigos/${aQuitar.amistadId}`);
    setAQuitar(null);
    setAviso({ texto: 'Amistad eliminada', tipo: 'success' });
    recargarTodo();
  }

  async function abrirChat(usuarioId) {
    try {
      const conversacion = await api.post('/api/chat', { destinatario: usuarioId });
      navigate(`/chat/${conversacion._id}`);
    } catch (err) {
      setAviso({ texto: err.message, tipo: 'error' });
    }
  }

  // botones de aceptar y rechazar
  const botonesRespuesta = (amistadId) => (
    <>
      <Button size="small" variant="contained" startIcon={<CheckIcon />} onClick={() => responder(amistadId, 'aceptada')}>
        Aceptar
      </Button>
      <Button size="small" variant="outlined" color="inherit" startIcon={<CloseIcon />} onClick={() => responder(amistadId, 'rechazada')}>
        Rechazar
      </Button>
    </>
  );

  const datos = amistades.datos;
  const pendientes = datos ? datos.recibidas.length : 0;

  return (
    <>
      <Typography variant="h4">Amigos</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Conecta con otras personas y chatea con ellas.
      </Typography>

      <Tabs value={pestana} onChange={(e, valor) => setPestana(valor)} sx={{ mb: 3, borderBottom: '1px solid #e6e2d8' }}>
        <Tab label={`Mis amigos${datos ? ` (${datos.amigos.length})` : ''}`} />
        <Tab label={`Solicitudes${pendientes ? ` (${pendientes})` : ''}`} />
        <Tab label="Buscar personas" />
      </Tabs>

      {/* mis amigos y solicitudes */}
      {pestana !== 2 && amistades.cargando && <Cargando />}
      {pestana !== 2 && amistades.error && <Alert severity="error">{amistades.error}</Alert>}

      {pestana === 0 && datos && (
        datos.amigos.length === 0 ? (
          <Vacio texto="Todavía no tienes amigos. Usa la pestaña Buscar personas para agregar a alguien." />
        ) : (
          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {datos.amigos.map((a) => (
              <FilaUsuario key={a.amistadId} usuario={a.usuario}>
                <Button size="small" variant="outlined" startIcon={<ChatBubbleOutlineIcon />} onClick={() => abrirChat(a.usuario._id)}>
                  Mensaje
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<PersonRemoveIcon />}
                  onClick={() => setAQuitar({ amistadId: a.amistadId, username: a.usuario.username })}
                >
                  Eliminar
                </Button>
              </FilaUsuario>
            ))}
          </Box>
        )
      )}

      {pestana === 1 && datos && (
        <>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Recibidas
          </Typography>
          {datos.recibidas.length === 0 ? (
            <Vacio texto="No tienes solicitudes pendientes." />
          ) : (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {datos.recibidas.map((s) => (
                <FilaUsuario key={s.amistadId} usuario={s.usuario} detalle="quiere ser tu amigo">
                  {botonesRespuesta(s.amistadId)}
                </FilaUsuario>
              ))}
            </Box>
          )}

          <Typography variant="h6" sx={{ mt: 4, mb: 1.5 }}>
            Enviadas
          </Typography>
          {datos.enviadas.length === 0 ? (
            <Vacio texto="No has enviado solicitudes." />
          ) : (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              {datos.enviadas.map((s) => (
                <FilaUsuario key={s.amistadId} usuario={s.usuario} detalle="esperando respuesta">
                  <Button size="small" color="inherit" onClick={() => cancelar(s.amistadId)}>
                    Cancelar
                  </Button>
                </FilaUsuario>
              ))}
            </Box>
          )}
        </>
      )}

      {/* buscar personas */}
      {pestana === 2 && (
        <>
          <TextField
            placeholder="Buscar por nombre de usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            size="small"
            fullWidth
            sx={{ mb: 3 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                )
              }
            }}
          />

          {personas.cargando && <Cargando />}
          {personas.error && <Alert severity="error">{personas.error}</Alert>}
          {personas.datos && personas.datos.length === 0 && <Vacio texto="No encontramos a nadie con ese nombre." />}

          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {personas.datos && personas.datos.map((p) => (
              <FilaUsuario
                key={p._id}
                usuario={p}
                detalle={`${p.resenas} ${p.resenas === 1 ? 'reseña' : 'reseñas'}`}
              >
                {p.relacion === 'ninguna' && (
                  <Button size="small" variant="contained" startIcon={<PersonAddIcon />} onClick={() => enviar(p._id)}>
                    Agregar
                  </Button>
                )}
                {p.relacion === 'enviada' && (
                  <>
                    <Chip label="Solicitud enviada" size="small" />
                    <Button size="small" color="inherit" onClick={() => cancelar(p.amistadId)}>
                      Cancelar
                    </Button>
                  </>
                )}
                {p.relacion === 'recibida' && botonesRespuesta(p.amistadId)}
                {p.relacion === 'amigos' && (
                  <>
                    <Chip label="Amigos" size="small" color="secondary" />
                    <Button size="small" variant="outlined" startIcon={<ChatBubbleOutlineIcon />} onClick={() => abrirChat(p._id)}>
                      Mensaje
                    </Button>
                  </>
                )}
              </FilaUsuario>
            ))}
          </Box>
        </>
      )}

      {aQuitar && (
        <Confirmar
          titulo="¿Eliminar amistad?"
          texto={`Dejarás de ser amigo de ${aQuitar.username} y ya no podrán escribirse. El historial del chat se conserva.`}
          textoBoton="Eliminar"
          onCerrar={() => setAQuitar(null)}
          onConfirmar={quitarAmigo}
        />
      )}

      <Snackbar
        open={Boolean(aviso.texto)}
        autoHideDuration={3500}
        onClose={() => setAviso({ ...aviso, texto: '' })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={aviso.tipo} variant="filled" onClose={() => setAviso({ ...aviso, texto: '' })}>
          {aviso.texto}
        </Alert>
      </Snackbar>
    </>
  );
}
