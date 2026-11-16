import { useEffect, useRef, useState } from 'react';
import { Alert, Avatar, Box, Button, IconButton, TextField, Tooltip, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import { api } from '../services/api';
import { errorTexto } from '../utils/validar';
import { fechaHora } from '../utils/formato';
import { colores } from '../theme';
import Cargando from './Cargando';
import Confirmar from './Confirmar';

// una burbuja de mensaje; los míos se pueden editar y borrar
function Burbuja({ mensaje, editando, onEditar, onBorrar, onGuardar, onCancelar }) {
  const [texto, setTexto] = useState(mensaje.texto);
  const [error, setError] = useState('');

  function guardar() {
    const e = errorTexto(texto, { etiqueta: 'El mensaje', max: 1000, obligatorio: true });
    setError(e);
    if (!e) onGuardar(texto.trim(), setError);
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: mensaje.mio ? 'flex-end' : 'flex-start', mb: 1 }}>
      <Box
        sx={{
          maxWidth: '75%',
          px: 1.5,
          py: 1,
          borderRadius: 2,
          bgcolor: mensaje.mio ? colores.noche : '#fff',
          color: mensaje.mio ? '#fff' : 'text.primary',
          border: mensaje.mio ? 'none' : '1px solid #e6e2d8'
        }}
      >
        {editando ? (
          <Box sx={{ minWidth: 220 }}>
            <TextField
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              error={Boolean(error)}
              helperText={error}
              size="small"
              multiline
              fullWidth
              autoFocus
              sx={{ bgcolor: '#fff', borderRadius: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button size="small" variant="contained" color="secondary" onClick={guardar}>
                Guardar
              </Button>
              <Button
                size="small"
                sx={{ color: '#fff' }}
                onClick={() => {
                  setTexto(mensaje.texto);
                  setError('');
                  onCancelar();
                }}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{mensaje.texto}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, mt: 0.25 }}>
              <Typography variant="caption" sx={{ opacity: 0.65 }}>
                {fechaHora(mensaje.createdAt)}
              </Typography>
              {mensaje.mio && (
                <>
                  <Tooltip title="Editar">
                    <IconButton size="small" onClick={onEditar} sx={{ color: 'inherit', opacity: 0.65, p: 0.25 }}>
                      <EditIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar">
                    <IconButton size="small" onClick={onBorrar} sx={{ color: 'inherit', opacity: 0.65, p: 0.25 }}>
                      <DeleteOutlineIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

// la conversación abierta: mensajes (se actualizan solos) y la caja para escribir
export default function Conversacion({ id, onVolver, onEliminada }) {
  const { datos, error, cargando, recargar } = useApi(`/api/chat/${id}/mensajes`);
  usePolling(recargar, 4000);

  const [texto, setTexto] = useState('');
  const [errorEnvio, setErrorEnvio] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [aBorrar, setABorrar] = useState(null);
  const [eliminandoConv, setEliminandoConv] = useState(false);

  // al llegar mensajes nuevos, bajar al final de la lista
  const lista = useRef(null);
  const total = datos ? datos.mensajes.length : 0;
  useEffect(() => {
    if (lista.current) lista.current.scrollTop = lista.current.scrollHeight;
  }, [total, id]);

  async function enviar() {
    const e = errorTexto(texto, { etiqueta: 'El mensaje', max: 1000, obligatorio: true });
    if (e) {
      setErrorEnvio(e);
      return;
    }

    try {
      setEnviando(true);
      setErrorEnvio('');
      await api.post(`/api/chat/${id}/mensajes`, { texto: texto.trim() });
      setTexto('');
      recargar();
    } catch (err) {
      setErrorEnvio(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function guardarEdicion(mensajeId, nuevoTexto, ponerError) {
    try {
      await api.put(`/api/chat/mensajes/${mensajeId}`, { texto: nuevoTexto });
      setEditandoId(null);
      recargar();
    } catch (err) {
      ponerError(err.message);
    }
  }

  async function borrarMensaje() {
    await api.delete(`/api/chat/mensajes/${aBorrar}`);
    setABorrar(null);
    recargar();
  }

  async function eliminarConversacion() {
    await api.delete(`/api/chat/${id}`);
    onEliminada();
  }

  if (cargando) return <Cargando />;
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button onClick={onVolver}>Volver</Button>
      </Box>
    );
  }

  const nombre = datos.otro ? datos.otro.username : 'Usuario eliminado';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* encabezado */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderBottom: '1px solid #eeeae0' }}>
        <IconButton onClick={onVolver} sx={{ display: { md: 'none' } }}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar src={datos.otro?.avatar || undefined}>{nombre[0].toUpperCase()}</Avatar>
        <Typography variant="h6" sx={{ flexGrow: 1 }} noWrap>
          {nombre}
        </Typography>
        <Tooltip title="Eliminar conversación">
          <IconButton onClick={() => setEliminandoConv(true)}>
            <DeleteSweepIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* mensajes */}
      <Box ref={lista} sx={{ flex: 1, overflow: 'auto', p: 2, bgcolor: '#faf8f3' }}>
        {datos.mensajes.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
            Aún no hay mensajes. ¡Saluda!
          </Typography>
        )}
        {datos.mensajes.map((m) => (
          <Burbuja
            key={m._id}
            mensaje={m}
            editando={editandoId === m._id}
            onEditar={() => setEditandoId(m._id)}
            onBorrar={() => setABorrar(m._id)}
            onGuardar={(nuevoTexto, ponerError) => guardarEdicion(m._id, nuevoTexto, ponerError)}
            onCancelar={() => setEditandoId(null)}
          />
        ))}
      </Box>

      {/* escribir (Enter envía, Shift+Enter hace salto de línea) */}
      <Box sx={{ p: 1.5, borderTop: '1px solid #eeeae0', display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <TextField
          placeholder="Escribe un mensaje..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              enviar();
            }
          }}
          error={Boolean(errorEnvio)}
          helperText={errorEnvio}
          size="small"
          multiline
          maxRows={4}
          fullWidth
        />
        <IconButton color="primary" onClick={enviar} disabled={enviando} aria-label="Enviar">
          <SendIcon />
        </IconButton>
      </Box>

      {aBorrar && (
        <Confirmar
          titulo="¿Eliminar mensaje?"
          texto="Se borrará para ambos. Esta acción no se puede deshacer."
          onCerrar={() => setABorrar(null)}
          onConfirmar={borrarMensaje}
        />
      )}
      {eliminandoConv && (
        <Confirmar
          titulo="¿Eliminar conversación?"
          texto="Se borrarán todos los mensajes para ambos. Esta acción no se puede deshacer."
          onCerrar={() => setEliminandoConv(false)}
          onConfirmar={eliminarConversacion}
        />
      )}
    </Box>
  );
}
