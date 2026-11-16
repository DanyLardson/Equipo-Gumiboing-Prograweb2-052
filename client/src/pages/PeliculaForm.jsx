import { useState } from 'react';
import { Alert, Box, Button, Card, CardContent, MenuItem, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { GENEROS } from '../utils/constantes';
import { errorAnio, errorAvatar, errorTexto } from '../utils/validar';
import Cargando from '../components/Cargando';
import Poster from '../components/Poster';

// formulario compartido: crear o editar
function Formulario({ pelicula }) {
  const navigate = useNavigate();
  const editando = Boolean(pelicula);

  const [form, setForm] = useState({
    titulo: pelicula ? pelicula.titulo : '',
    anio: pelicula ? String(pelicula.anio) : '',
    director: pelicula ? pelicula.director : '',
    genero: pelicula ? pelicula.genero : '',
    poster: pelicula ? pelicula.poster || '' : '',
    sinopsis: pelicula ? pelicula.sinopsis || '' : ''
  });
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });
  const posterValido = form.poster.trim() && !errorAvatar(form.poster);

  async function guardar(evento) {
    evento.preventDefault();
    setErrorServidor('');

    const nuevos = {};
    const eTitulo = errorTexto(form.titulo, { etiqueta: 'El título', max: 150, obligatorio: true });
    const eDirector = errorTexto(form.director, { etiqueta: 'El director', max: 100, obligatorio: true });
    const eSinopsis = errorTexto(form.sinopsis, { max: 2000 });
    const eAnio = errorAnio(form.anio);
    const ePoster = errorAvatar(form.poster);
    if (eTitulo) nuevos.titulo = eTitulo;
    if (eDirector) nuevos.director = eDirector;
    if (eSinopsis) nuevos.sinopsis = eSinopsis;
    if (eAnio) nuevos.anio = eAnio;
    if (ePoster) nuevos.poster = ePoster;
    if (!form.genero) nuevos.genero = 'Elige un género';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    const cuerpo = {
      titulo: form.titulo.trim(),
      anio: Number(form.anio),
      director: form.director.trim(),
      genero: form.genero,
      poster: form.poster.trim(),
      sinopsis: form.sinopsis.trim()
    };

    try {
      setEnviando(true);
      const guardada = editando
        ? await api.put(`/api/peliculas/${pelicula._id}`, cuerpo)
        : await api.post('/api/peliculas', cuerpo);
      navigate(`/peliculas/${guardada._id}`, { replace: true });
    } catch (err) {
      setErrorServidor(err.message);
      setEnviando(false);
    }
  }

  const volver = editando ? `/peliculas/${pelicula._id}` : '/';

  return (
    <>
      <Button component={RouterLink} to={volver} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Volver
      </Button>

      <Typography variant="h4" sx={{ mb: 3 }}>
        {editando ? 'Editar película' : 'Agregar película'}
      </Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {errorServidor && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorServidor}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={guardar}
            noValidate
            sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 200px' }, gap: 3 }}
          >
            <Box sx={{ display: 'grid', gap: 2 }}>
              <TextField
                label="Título"
                value={form.titulo}
                onChange={cambiar('titulo')}
                error={Boolean(errores.titulo)}
                helperText={errores.titulo}
                fullWidth
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="Año"
                  type="number"
                  value={form.anio}
                  onChange={cambiar('anio')}
                  error={Boolean(errores.anio)}
                  helperText={errores.anio}
                  fullWidth
                />
                <TextField
                  select
                  label="Género"
                  value={form.genero}
                  onChange={cambiar('genero')}
                  error={Boolean(errores.genero)}
                  helperText={errores.genero}
                  fullWidth
                >
                  {GENEROS.map((g) => (
                    <MenuItem key={g} value={g}>
                      {g}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>
              <TextField
                label="Director"
                value={form.director}
                onChange={cambiar('director')}
                error={Boolean(errores.director)}
                helperText={errores.director}
                fullWidth
              />
              <TextField
                label="Póster (URL de la imagen, opcional)"
                value={form.poster}
                onChange={cambiar('poster')}
                error={Boolean(errores.poster)}
                helperText={errores.poster}
                fullWidth
              />
              <TextField
                label="Sinopsis (opcional)"
                value={form.sinopsis}
                onChange={cambiar('sinopsis')}
                error={Boolean(errores.sinopsis)}
                helperText={errores.sinopsis || `${form.sinopsis.trim().length}/2000`}
                multiline
                minRows={4}
                fullWidth
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button type="submit" variant="contained" disabled={enviando}>
                  {enviando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar película'}
                </Button>
                <Button component={RouterLink} to={volver} disabled={enviando}>
                  Cancelar
                </Button>
              </Box>
            </Box>

            {/* Vista previa del póster */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Vista previa
              </Typography>
              <Box sx={{ borderRadius: 2, overflow: 'hidden', mt: 0.5 }}>
                <Poster src={posterValido ? form.poster.trim() : ''} alt="Vista previa del póster" alto={290} />
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}

// para editar hay que traer primero la película y comprobar que se puede modificar
function Editar({ id }) {
  const { usuario, esAdmin } = useAuth();
  const { datos, error, cargando } = useApi(`/api/peliculas/${id}`);

  if (cargando) return <Cargando />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!esAdmin && String(datos.creadoPor) !== usuario._id) {
    return <Alert severity="warning">Solo quien agregó la película puede editarla.</Alert>;
  }
  return <Formulario pelicula={datos} />;
}

export default function PeliculaForm() {
  const { id } = useParams();
  return id ? <Editar id={id} /> : <Formulario pelicula={null} />;
}
