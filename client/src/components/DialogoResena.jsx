import { useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Rating, TextField, Typography } from '@mui/material';
import { api } from '../services/api';
import { errorTexto } from '../utils/validar';

// crear una reseña o editar la que ya existe
export default function DialogoResena({ peliculaId, resena, onCerrar, onGuardada }) {
  const editando = Boolean(resena);
  const [form, setForm] = useState({
    calificacion: resena ? resena.calificacion : 0,
    titulo: resena ? resena.titulo : '',
    texto: resena ? resena.texto : ''
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function guardar(evento) {
    evento.preventDefault();
    setErrorServidor('');

    const nuevos = {};
    if (!form.calificacion) nuevos.calificacion = 'Elige una calificación de 1 a 5 estrellas';
    const eTitulo = errorTexto(form.titulo, { etiqueta: 'El título', max: 120, obligatorio: true });
    const eTexto = errorTexto(form.texto, { etiqueta: 'La reseña', max: 3000, obligatorio: true });
    if (eTitulo) nuevos.titulo = eTitulo;
    if (eTexto) nuevos.texto = eTexto;
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    const cuerpo = {
      calificacion: form.calificacion,
      titulo: form.titulo.trim(),
      texto: form.texto.trim()
    };

    try {
      setEnviando(true);
      if (editando) await api.put(`/api/resenas/${resena._id}`, cuerpo);
      else await api.post('/api/resenas', { ...cuerpo, pelicula: peliculaId });
      onGuardada(editando ? 'Reseña actualizada' : 'Reseña publicada');
    } catch (err) {
      setErrorServidor(err.message);
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : onCerrar} fullWidth maxWidth="sm">
      <DialogTitle>{editando ? 'Editar mi reseña' : 'Escribir una reseña'}</DialogTitle>
      <DialogContent>
        {errorServidor && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorServidor}
          </Alert>
        )}
        <Box id="form-resena" component="form" onSubmit={guardar} noValidate sx={{ display: 'grid', gap: 2, pt: 1 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Tu calificación
            </Typography>
            <Rating
              value={form.calificacion}
              onChange={(e, valor) => setForm({ ...form, calificacion: valor || 0 })}
              size="large"
            />
            {errores.calificacion && (
              <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                {errores.calificacion}
              </Typography>
            )}
          </Box>
          <TextField
            label="Título de tu reseña"
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            error={Boolean(errores.titulo)}
            helperText={errores.titulo}
            fullWidth
          />
          <TextField
            label="Tu reseña"
            value={form.texto}
            onChange={(e) => setForm({ ...form, texto: e.target.value })}
            error={Boolean(errores.texto)}
            helperText={errores.texto || `${form.texto.trim().length}/3000`}
            multiline
            minRows={5}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button type="submit" form="form-resena" variant="contained" disabled={enviando}>
          {enviando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Publicar reseña'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
