import { useEffect, useState } from 'react';
import { Alert, Box, Button, Chip, InputAdornment, Snackbar, TextField, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import { api } from '../../services/api';
import { fechaCorta } from '../../utils/formato';
import Cargando from '../Cargando';
import Confirmar from '../Confirmar';
import FilaUsuario from '../FilaUsuario';

const ROLES = [
  { valor: '', texto: 'Todos' },
  { valor: 'usuario', texto: 'Usuarios' },
  { valor: 'admin', texto: 'Administradores' }
];

// gestión de usuarios: buscar, cambiar rol y eliminar
export default function AdminUsuarios({ onCambio }) {
  const { usuario: yo } = useAuth();
  const [busqueda, setBusqueda] = useState('');
  const [q, setQ] = useState('');
  const [rol, setRol] = useState('');
  const [accion, setAccion] = useState(null); // tipo: rol, eliminar y usuario
  const [aviso, setAviso] = useState('');

  // espera un momento después de escribir antes de buscar
  useEffect(() => {
    const espera = setTimeout(() => setQ(busqueda.trim()), 350);
    return () => clearTimeout(espera);
  }, [busqueda]);

  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (rol) params.set('rol', rol);
  const { datos, error, cargando, recargar } = useApi(`/api/usuarios?${params.toString()}`);

  function terminado(mensaje) {
    setAccion(null);
    setAviso(mensaje);
    recargar();
    onCambio();
  }

  async function cambiarRol() {
    const nuevo = accion.usuario.rol === 'admin' ? 'usuario' : 'admin';
    await api.put(`/api/usuarios/${accion.usuario._id}`, { rol: nuevo });
    terminado(nuevo === 'admin' ? 'Ahora es administrador' : 'Ya no es administrador');
  }

  async function eliminar() {
    await api.delete(`/api/usuarios/${accion.usuario._id}`);
    terminado('Usuario eliminado');
  }

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 3 }}>
        <TextField
          placeholder="Buscar por nombre o correo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          size="small"
          sx={{ flex: '1 1 260px' }}
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
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {ROLES.map((r) => (
            <Chip
              key={r.valor || 'todos'}
              label={r.texto}
              clickable
              color={rol === r.valor ? 'primary' : 'default'}
              variant={rol === r.valor ? 'filled' : 'outlined'}
              onClick={() => setRol(r.valor)}
            />
          ))}
        </Box>
      </Box>

      {cargando && <Cargando />}
      {error && <Alert severity="error">{error}</Alert>}

      {datos && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {datos.length} {datos.length === 1 ? 'usuario' : 'usuarios'}
          </Typography>
          {datos.length === 0 && <Alert severity="info">No encontramos usuarios con esos filtros.</Alert>}

          <Box sx={{ display: 'grid', gap: 1.5 }}>
            {datos.map((u) => {
              const soyYo = u._id === yo._id;
              const esAdminU = u.rol === 'admin';
              return (
                <FilaUsuario key={u._id} usuario={u} detalle={`${u.email} · desde ${fechaCorta(u.createdAt)}`}>
                  <Chip label={esAdminU ? 'Administrador' : 'Usuario'} size="small" color={esAdminU ? 'secondary' : 'default'} />
                  {soyYo ? (
                    <Chip label="Tú" size="small" variant="outlined" />
                  ) : (
                    <>
                      <Button size="small" variant="outlined" onClick={() => setAccion({ tipo: 'rol', usuario: u })}>
                        {esAdminU ? 'Quitar admin' : 'Hacer admin'}
                      </Button>
                      {/* un admin no se elimina: primero hay que quitarle el rol */}
                      <Button
                        size="small"
                        color="error"
                        disabled={esAdminU}
                        onClick={() => setAccion({ tipo: 'eliminar', usuario: u })}
                      >
                        Eliminar
                      </Button>
                    </>
                  )}
                </FilaUsuario>
              );
            })}
          </Box>
        </>
      )}

      {accion && accion.tipo === 'rol' && (
        <Confirmar
          titulo={accion.usuario.rol === 'admin' ? '¿Quitar el rol de admin?' : '¿Hacer administrador?'}
          texto={
            accion.usuario.rol === 'admin'
              ? `${accion.usuario.username} volverá a ser un usuario normal.`
              : `${accion.usuario.username} podrá moderar contenido, ver reportes y gestionar usuarios.`
          }
          textoBoton="Confirmar"
          onCerrar={() => setAccion(null)}
          onConfirmar={cambiarRol}
        />
      )}
      {accion && accion.tipo === 'eliminar' && (
        <Confirmar
          titulo={`¿Eliminar a ${accion.usuario.username}?`}
          texto="Se borrarán su cuenta, reseñas, comentarios, mensajes, foros, amistades y conversaciones. Las películas que agregó se conservan. Esta acción no se puede deshacer."
          textoBoton="Eliminar usuario"
          onCerrar={() => setAccion(null)}
          onConfirmar={eliminar}
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
