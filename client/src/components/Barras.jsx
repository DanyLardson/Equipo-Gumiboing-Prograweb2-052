import { Box, Typography } from '@mui/material';
import { colores } from '../theme';

// barras horizontales: una fila por dato
export function BarrasHorizontales({ datos, maximo, color = colores.dorado, formato = (v) => v }) {
  const tope = maximo ?? Math.max(...datos.map((d) => d.valor), 1);

  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      {datos.map((d) => (
        <Box
          key={d.etiqueta}
          sx={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 170px) 1fr 52px', alignItems: 'center', gap: 1.5 }}
        >
          <Typography variant="body2" noWrap title={d.etiqueta}>
            {d.etiqueta}
          </Typography>
          <Box sx={{ height: 14, bgcolor: '#eeeae0', borderRadius: 7, overflow: 'hidden' }}>
            <Box
              sx={{
                width: `${Math.min((d.valor / tope) * 100, 100)}%`,
                height: '100%',
                bgcolor: d.color || color,
                borderRadius: 7
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ fontWeight: 600, textAlign: 'right' }}>
            {formato(d.valor)}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// barras verticales: una columna por dato
export function BarrasVerticales({ datos, alto = 150, color = colores.dorado }) {
  const tope = Math.max(...datos.map((d) => d.valor), 1);

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: alto + 48, pt: 1 }}>
      {datos.map((d) => (
        <Box
          key={d.etiqueta}
          sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {d.valor}
          </Typography>
          <Box
            sx={{
              width: '70%',
              maxWidth: 52,
              height: `${(d.valor / tope) * alto}px`,
              minHeight: d.valor ? 4 : 2,
              bgcolor: color,
              borderRadius: '6px 6px 0 0',
              mt: 0.5
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
            {d.etiqueta}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
