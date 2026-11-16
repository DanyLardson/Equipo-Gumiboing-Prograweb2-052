import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import MovieIcon from '@mui/icons-material/Movie';
import { colores } from '../theme';

// póster de una película. Si no tiene imagen, o la dirección no jala, muestra un recuadro con un icono.
export default function Poster({ src, alt = '', alto = 260, sx }) {
  const [fallo, setFallo] = useState(false);

  // si cambia la imagen, se vuelve a intentar
  useEffect(() => setFallo(false), [src]);

  if (!src || fallo) {
    return (
      <Box
        role="img"
        aria-label={alt}
        sx={{
          height: alto,
          bgcolor: colores.noche,
          color: colores.dorado,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx
        }}
      >
        <MovieIcon sx={{ fontSize: Math.min(alto / 3, 64) }} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={src}
      alt={alt}
      onError={() => setFallo(true)}
      sx={{ display: 'block', width: '100%', height: alto, objectFit: 'cover', ...sx }}
    />
  );
}
