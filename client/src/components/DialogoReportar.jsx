import { useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  MenuItem, TextField
} from '@mui/material';
import { api } from '../services/api';
import { errorTexto } from '../utils/validar';

const NOMBRES = { Pelicula: 'película', Resena: 'reseña', Comentario: 'comentario', MensajeForo: 'mensaje' };

// para las películas se elige un motivo de la lista (y se pueden dar detalles).
const MOTIVOS = {
  Pelicula: [
    'Datos incorrectos',
    'Incumple las normas de la comunidad',
    'Contenido inapropiado',
    'Película duplicada',
    'Otro'
  ]
};

const AYUDA_DETALLE = {
  'Datos incorrectos': '¿Qué dato está mal? (año, director, género, sinopsis...)',
  'Incumple las normas de la comunidad': '¿Qué norma incumple?',
  'Contenido inapropiado': '¿Qué contenido es inapropiado? (póster, sinopsis...)',
  'Película duplicada': '¿Cuál es la película original?',
  Otro: 'Cuéntanos qué pasa'
};

// reporta una película, reseña, comentario o mensaje de foro
export default function DialogoReportar({ tipo, contenido, onCerrar, onReportado }) {
  const motivos = MOTIVOS[tipo]; // undefined si el tipo no usa lista de motivos
  const [motivo, setMotivo] = useState('');
  const [detalle, setDetalle] = useState('');
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  // el backend guarda un solo texto de máximo 300 caracteres: "motivo detalle"
  const maxDetalle = motivos ? 300 - (motivo.length + 2) : 300;

  async function enviar(evento) {
    evento.preventDefault();
    setErrorServidor('');

    const nuevos = {};
    let razon;

    if (motivos) {
      if (!motivo) nuevos.motivo = 'Elige un motivo';
      const eDetalle = errorTexto(detalle, {
        etiqueta: 'El detalle',
        max: Math.max(maxDetalle, 0),
        obligatorio: motivo === 'Otro'
      });
      if (eDetalle) nuevos.detalle = eDetalle;
      razon = detalle.trim() ? `${motivo}: ${detalle.trim()}` : motivo;
    } else {
      const eRazon = errorTexto(detalle, { etiqueta: 'El motivo', max: 300, obligatorio: true });
      if (eRazon) nuevos.detalle = eRazon;
      razon = detalle.trim();
    }

    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    try {
      setEnviando(true);
      await api.post('/api/reportes', { tipo, contenido, razon });
      onReportado();
    } catch (err) {
      setErrorServidor(err.message);
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : onCerrar} fullWidth maxWidth="xs">
      <DialogTitle>Reportar {NOMBRES[tipo]}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Un administrador revisará el reporte. Cuéntanos qué pasa.
        </DialogContentText>
        {errorServidor && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorServidor}
          </Alert>
        )}
        <Box id="form-reportar" component="form" onSubmit={enviar} noValidate sx={{ display: 'grid', gap: 2 }}>
          {motivos && (
            <TextField
              select
              label="Motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              error={Boolean(errores.motivo)}
              helperText={errores.motivo}
              fullWidth
            >
              {motivos.map((m) => (
                <MenuItem key={m} value={m}>
                  {m}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label={motivos ? (motivo === 'Otro' ? 'Detalles' : 'Detalles (opcional)') : 'Motivo'}
            placeholder={motivos ? AYUDA_DETALLE[motivo] || 'Cuéntanos más...' : 'Ej: lenguaje ofensivo, spoilers sin aviso...'}
            value={detalle}
            onChange={(e) => setDetalle(e.target.value)}
            error={Boolean(errores.detalle)}
            helperText={errores.detalle || `${detalle.trim().length}/${Math.max(maxDetalle, 0)}`}
            multiline
            minRows={3}
            fullWidth
            autoFocus={!motivos}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" form="form-reportar" variant="contained" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar reporte'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
