import { Box, Card, Typography, useMediaQuery } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import Conversacion from '../components/Conversacion';
import ListaConversaciones from '../components/ListaConversaciones';

// en pantallas grandes se ven la lista y la conversación; en celular, una a la vez
export default function Chat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esGrande = useMediaQuery((tema) => tema.breakpoints.up('md'));

  const mostrarLista = esGrande || !id;
  const mostrarConversacion = esGrande || Boolean(id);

  return (
    <>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Chat
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: esGrande ? '320px 1fr' : '1fr',
          gap: 2,
          height: 'calc(100vh - 210px)',
          minHeight: 460
        }}
      >
        {mostrarLista && (
          <Card sx={{ overflow: 'hidden', minHeight: 0 }}>
            <ListaConversaciones activaId={id} />
          </Card>
        )}

        {mostrarConversacion && (
          <Card sx={{ overflow: 'hidden', minHeight: 0 }}>
            {id ? (
              <Conversacion
                key={id}
                id={id}
                onVolver={() => navigate('/chat')}
                onEliminada={() => navigate('/chat', { replace: true })}
              />
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
                <Typography color="text.secondary" align="center">
                  Elige una conversación para empezar a chatear.
                </Typography>
              </Box>
            )}
          </Card>
        )}
      </Box>
    </>
  );
}
