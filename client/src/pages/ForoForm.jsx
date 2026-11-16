import { useState } from 'react';
import { Alert, Autocomplete, Box, Button, Card, CardContent, TextField, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { errorTexto } from '../utils/validar';
import Cargando from '../components/Cargando';

// formulario para crear un foro o editar uno existente
function Formulario({ foro, peliculas, peliculaInicial }) {
  const navigate = useNavigate();
  const editando = Boolean(foro);

  const [pelicula, setPelicula] = useState(
    editando ? null : (peliculas || []).find((p) => p._id === peliculaInicial) || null
  );
  const [titulo, setTitulo] = useState(foro ? foro.titulo : '');
  const [descripcion, setDescripcion] = useState(foro ? foro.descripcion || '' : '');
  const [errores, setErrores] = useState({});
  const [errorServidor, setErrorServidor] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function guardar(evento) {
    evento.preventDefault();
    setErrorServidor('');

    const nuevos = {};
    if (!editando && !pelicula) nuevos.pelicula = 'Elige la película del foro';
    const eTitulo = errorTexto(titulo, { etiqueta: 'El título', max: 150, obligatorio: true });
    const eDescripcion = errorTexto(descripcion, { max: 2000 });
    if (eTitulo) nuevos.titulo = eTitulo;
    if (eDescripcion) nuevos.descripcion = eDescripcion;
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    const cuerpo = { titulo: titulo.trim(), descripcion: descripcion.trim() };

    try {
      setEnviando(true);
      const guardado = editando
        ? await api.put(`/api/foros/${foro._id}`, cuerpo)
        : await api.post('/api/foros', { ...cuerpo, pelicula: pelicula._id });
      navigate(`/foros/${guardado._id}`, { replace: true });
    } catch (err) {
      setErrorServidor(err.message);
      setEnviando(false);
    }
  }

  const volver = editando ? `/foros/${foro._id}` : '/foros';

  return (
    <>
      <Button component={RouterLink} to={volver} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Volver
      </Button>

      <Typography variant="h4" sx={{ mb: 3 }}>
        {editando ? 'Editar foro' : 'Crear foro'}
      </Typography>

      <Card>
        <CardContent sx={{ p: 3 }}>
          {errorServidor && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorServidor}
            </Alert>
          )}

          <Box component="form" onSubmit={guardar} noValidate sx={{ display: 'grid', gap: 2, maxWidth: 640 }}>
            {editando ? (
              // la película de un foro no se puede cambiar
              <TextField
                label="Película"
                value={`${foro.pelicula.titulo} (${foro.pelicula.anio})`}
                disabled
                fullWidth
              />
            ) : (
              <Autocomplete
                options={peliculas}
                value={pelicula}
                onChange={(e, valor) => setPelicula(valor)}
                getOptionLabel={(p) => `${p.titulo} (${p.anio})`}
                isOptionEqualToValue={(a, b) => a._id === b._id}
                noOptionsText="No hay películas con ese nombre"
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Película"
                    error={Boolean(errores.pelicula)}
                    helperText={errores.pelicula}
                  />
                )}
              />
            )}

            <TextField
              label="Título del foro"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              error={Boolean(errores.titulo)}
              helperText={errores.titulo}
              fullWidth
            />
            <TextField
              label="Mensaje inicial (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              error={Boolean(errores.descripcion)}
              helperText={errores.descripcion || `${descripcion.trim().length}/2000`}
              multiline
              minRows={4}
              fullWidth
            />

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button type="submit" variant="contained" disabled={enviando}>
                {enviando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear foro'}
              </Button>
              <Button component={RouterLink} to={volver} disabled={enviando}>
                Cancelar
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}

// crear: trae las películas para el selector
function Crear() {
  const [params] = useSearchParams();
  const { datos, error, cargando } = useApi('/api/peliculas');

  if (cargando) return <Cargando />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!datos.length) return <Alert severity="info">Primero agrega una película para poder crear un foro.</Alert>;

  const ordenadas = [...datos].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
  return <Formulario foro={null} peliculas={ordenadas} peliculaInicial={params.get('pelicula') || ''} />;
}

// editar: trae el foro y revisa que se pueda modificar
function Editar({ id }) {
  const { usuario, esAdmin } = useAuth();
  const { datos, error, cargando } = useApi(`/api/foros/${id}`);

  if (cargando) return <Cargando />;
  if (error) return <Alert severity="error">{error}</Alert>;

  const { foro } = datos;
  if (!esAdmin && !(foro.creadoPor && foro.creadoPor._id === usuario._id)) {
    return <Alert severity="warning">Solo quien creó el foro puede editarlo.</Alert>;
  }
  return <Formulario foro={foro} />;
}

export default function ForoForm() {
  const { id } = useParams();
  return id ? <Editar id={id} /> : <Crear />;
}
