import { Avatar, Box, Card, CardContent, Typography } from '@mui/material';

// fila de una persona con sus botones a la derecha
export default function FilaUsuario({ usuario, detalle, children }) {
  return (
    <Card>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Avatar src={usuario.avatar || undefined}>{usuario.username[0].toUpperCase()}</Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600 }} noWrap>
            {usuario.username}
          </Typography>
          {detalle && (
            <Typography variant="caption" color="text.secondary">
              {detalle}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>{children}</Box>
      </CardContent>
    </Card>
  );
}
