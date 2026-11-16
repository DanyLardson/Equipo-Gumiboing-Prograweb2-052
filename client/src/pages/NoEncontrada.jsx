import { Box, Button, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function NoEncontrada() {
  return (
    <Box sx={{ textAlign: 'center', py: 12 }}>
      <Typography variant="h2">404</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Esta página no existe.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained">
        Ir al inicio
      </Button>
    </Box>
  );
}
