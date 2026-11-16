import { Box, Card, CardActionArea, CardContent, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { Link as RouterLink } from 'react-router-dom';
import { fechaCorta } from '../utils/formato';

// fila de un foro en las listas 
export default function FilaForo({ foro, mostrarPelicula = true }) {
  const partes = [];
  if (mostrarPelicula && foro.pelicula) partes.push(`${foro.pelicula.titulo} (${foro.pelicula.anio})`);
  partes.push(`por ${foro.creadoPor ? foro.creadoPor.username : 'usuario eliminado'}`);
  partes.push(fechaCorta(foro.createdAt));

  return (
    <Card>
      <CardActionArea component={RouterLink} to={`/foros/${foro._id}`}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
              {foro.titulo}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {partes.join(' · ')}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <ChatBubbleOutlineIcon fontSize="small" />
            <Typography variant="body2">{foro.respuestas}</Typography>
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
