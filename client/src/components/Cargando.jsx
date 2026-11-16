import { Box, CircularProgress } from '@mui/material';

export default function Cargando() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
      <CircularProgress color="secondary" />
    </Box>
  );
}
