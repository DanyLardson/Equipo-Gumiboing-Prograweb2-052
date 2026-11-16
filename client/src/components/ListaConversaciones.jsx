import { Alert, Avatar, Badge, Box, Button, List, ListItemAvatar, ListItemButton, ListItemText, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { usePolling } from '../hooks/usePolling';
import Cargando from './Cargando';

// mis conversaciones, con el último mensaje y los no leídos
export default function ListaConversaciones({ activaId }) {
  const { datos, error, cargando, recargar } = useApi('/api/chat');
  usePolling(recargar, 6000);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Typography variant="h6" sx={{ p: 2, borderBottom: '1px solid #eeeae0' }}>
        Conversaciones
      </Typography>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {cargando && <Cargando />}
        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

        {datos && datos.length === 0 && (
          <Box sx={{ p: 2 }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Todavía no tienes conversaciones. Escríbele a un amigo desde la sección Amigos.
            </Typography>
            <Button component={RouterLink} to="/amigos" variant="outlined" size="small">
              Ir a Amigos
            </Button>
          </Box>
        )}

        {datos && datos.length > 0 && (
          <List disablePadding>
            {datos.map((c) => {
              const nombre = c.otro ? c.otro.username : 'Usuario eliminado';
              const ultimo = c.ultimoMensaje
                ? `${c.ultimoMensaje.mio ? 'Tú: ' : ''}${c.ultimoMensaje.texto}`
                : 'Sin mensajes todavía';
              return (
                <ListItemButton
                  key={c._id}
                  component={RouterLink}
                  to={`/chat/${c._id}`}
                  selected={c._id === activaId}
                >
                  <ListItemAvatar>
                    <Badge badgeContent={c.noLeidos} color="primary">
                      <Avatar src={c.otro?.avatar || undefined}>{nombre[0].toUpperCase()}</Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={nombre}
                    secondary={ultimo}
                    primaryTypographyProps={{ noWrap: true, sx: { fontWeight: c.noLeidos ? 700 : 500 } }}
                    secondaryTypographyProps={{ noWrap: true }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
}
