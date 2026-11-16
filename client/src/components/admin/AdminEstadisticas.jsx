import { Alert, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useApi } from '../../hooks/useApi';
import { fechaCorta } from '../../utils/formato';
import { BarrasHorizontales } from '../Barras';
import Cargando from '../Cargando';
import { colores } from '../../theme';

const TIPOS = { Pelicula: 'Película', Resena: 'Reseña', Comentario: 'Comentario', MensajeForo: 'Mensaje de foro' };

// título, qué responde la consulta y su contenido
function Seccion({ titulo, descripcion, estado, children }) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6">{titulo}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {descripcion}
        </Typography>
        {estado.cargando && <Cargando />}
        {estado.error && <Alert severity="error">{estado.error}</Alert>}
        {estado.datos && (estado.datos.length === 0 ? <Alert severity="info">Todavía no hay datos.</Alert> : children)}
      </CardContent>
    </Card>
  );
}

// tabla sencilla
function Tabla({ columnas, filas }) {
  return (
    <TableContainer sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columnas.map((c) => (
              <TableCell key={c} sx={{ fontWeight: 700 }}>
                {c}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filas.map((fila, i) => (
            <TableRow key={i}>
              {fila.map((celda, j) => (
                <TableCell key={j}>{celda}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// las 4 consultas del panel, cada una con su tabla
export default function AdminEstadisticas() {
  const peliculas = useApi('/api/estadisticas/peliculas-top?limite=10');
  const usuarios = useApi('/api/estadisticas/usuarios-activos?limite=10');
  const reportado = useApi('/api/estadisticas/contenido-reportado?limite=10');
  const generos = useApi('/api/estadisticas/generos');

  return (
    <>
      <Seccion
        titulo="1. Películas mejor calificadas"
        descripcion="Las 10 con mejor promedio, con sus reseñas, comentarios y foros."
        estado={peliculas}
      >
        {peliculas.datos && (
          <>
            <BarrasHorizontales
              maximo={5}
              formato={(v) => v.toFixed(1)}
              datos={peliculas.datos.map((p) => ({ etiqueta: p.titulo, valor: p.promedio }))}
            />
            <Tabla
              columnas={['Película', 'Género', 'Promedio', 'Reseñas', 'Comentarios', 'Foros', 'Likes']}
              filas={peliculas.datos.map((p) => [
                `${p.titulo} (${p.anio})`, p.genero, p.promedio, p.totalResenas, p.totalComentarios, p.totalForos, p.totalLikes
              ])}
            />
          </>
        )}
      </Seccion>

      <Seccion
        titulo="2. Usuarios más activos"
        descripcion="Actividad = reseñas + comentarios + mensajes de foro + foros creados."
        estado={usuarios}
      >
        {usuarios.datos && (
          <>
            <BarrasHorizontales
              color={colores.rojo}
              datos={usuarios.datos.map((u) => ({ etiqueta: u.username, valor: u.actividad }))}
            />
            <Tabla
              columnas={['Usuario', 'Reseñas', 'Comentarios', 'Mensajes de foro', 'Foros', 'Likes recibidos', 'Actividad']}
              filas={usuarios.datos.map((u) => [
                u.username, u.totalResenas, u.totalComentarios, u.totalMensajesForo, u.totalForos, u.likesRecibidos, u.actividad
              ])}
            />
          </>
        )}
      </Seccion>

      <Seccion
        titulo="3. Contenido más reportado"
        descripcion="Lo que más reportes acumula, con su autor y su estado de moderación."
        estado={reportado}
      >
        {reportado.datos && (
          <Tabla
            columnas={['Tipo', 'Contenido', 'Autor', 'Reportes', 'Pendientes', 'Estado', 'Último reporte']}
            filas={reportado.datos.map((r) => [
              TIPOS[r.tipo],
              (r.titulo || r.texto || '[contenido eliminado]').slice(0, 60),
              r.autor || '-',
              r.totalReportes,
              r.pendientes,
              r.estado,
              fechaCorta(r.ultimoReporte)
            ])}
          />
        )}
      </Seccion>

      <Seccion
        titulo="4. Actividad por género"
        descripcion="Cuánto se publica y qué tan bien se califica cada género."
        estado={generos}
      >
        {generos.datos && (
          <>
            <BarrasHorizontales datos={generos.datos.map((g) => ({ etiqueta: g.genero, valor: g.resenas }))} />
            <Typography variant="caption" color="text.secondary">
              Barras: reseñas por género
            </Typography>
            <Tabla
              columnas={['Género', 'Películas', 'Reseñas', 'Foros', 'Mensajes de foro', 'Promedio']}
              filas={generos.datos.map((g) => [g.genero, g.peliculas, g.resenas, g.foros, g.mensajesForo, g.promedio])}
            />
          </>
        )}
      </Seccion>
    </>
  );
}
