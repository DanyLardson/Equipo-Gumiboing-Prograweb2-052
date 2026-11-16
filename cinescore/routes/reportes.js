const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { Reporte, Usuario, Pelicula, Resena, Comentario, MensajeForo } = require('../models');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { usuarioActual } = require('../utils/permisos');
const {
  TIPOS_REPORTE, ESTADOS_REPORTE, validarReporte, validarEstadoReporte
} = require('../utils/validaciones');
const { borrarPelicula, borrarResenas, borrarComentarios, borrarMensajesForo } = require('../utils/cascada');
const { recalcular } = require('./resenas');

const router = express.Router();

// a q colección apunta cada tipo de reporte
const MODELOS = { Pelicula, Resena, Comentario, MensajeForo };

// en q campo de cada colección está el autor del contenido
const CAMPO_AUTOR = { Pelicula: 'creadoPor', Resena: 'usuario', Comentario: 'usuario', MensajeForo: 'usuario' };

// Trae el/los reporte(s) con quién reportó y un resumen del contenido reportado, más los nombres de los autores de ese contenido (reseñas, comentarios y mensajes susan "usuario"; las películas usan "creadoPor").
async function conDetalle(consulta) {
  const resultado = await consulta
    .populate('reportadoPor', 'username')
    .populate({ path: 'contenido', select: 'titulo texto sinopsis usuario creadoPor' });

  const lista = Array.isArray(resultado) ? resultado : (resultado ? [resultado] : []);
  const idsAutores = new Set();
  for (const r of lista) {
    const autor = r.contenido && (r.contenido.usuario || r.contenido.creadoPor);
    if (autor) idsAutores.add(String(autor));
  }
  const autores = await Usuario.find({ _id: { $in: [...idsAutores] } }).select('username');

  return { resultado, autores: new Map(autores.map(u => [String(u._id), u])) };
}

// "contenido" es null si el contenido ya fue eliminado (el reporte queda como historial)
function formatear(r, autores) {
  const c = r.contenido;
  let contenido = null;
  if (c) {
    const autorId = c.usuario || c.creadoPor;
    const autor = autorId ? autores.get(String(autorId)) : null;
    contenido = {
      _id: c._id,
      titulo: c.titulo,
      // reseña, comentario y mensaje tienen "texto"; la película tiene "sinopsis"
      texto: c.texto ?? c.sinopsis ?? '',
      usuario: autor ? { _id: autor._id, username: autor.username } : (autorId ? { _id: autorId } : null)
    };
  }
  return {
    _id: r._id,
    tipo: r.tipo,
    estado: r.estado,
    razon: r.razon,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    reportadoPor: r.reportadoPor,
    contenido
  };
}

// POST /api/reportes  (cualquier usuario con sesión)
router.post('/', requireLogin, async (req, res) => {
  try {
    const { error, datos } = validarReporte(req.body);
    if (error) return res.status(400).json({ error });

    const yo = usuarioActual(req).id;
    const campoAutor = CAMPO_AUTOR[datos.tipo];
    const contenido = await MODELOS[datos.tipo].findById(datos.contenido).select(campoAutor);
    if (!contenido) return res.status(404).json({ error: 'El contenido que quieres reportar no existe' });

    if (String(contenido[campoAutor]) === String(yo)) {
      return res.status(400).json({ error: 'No puedes reportar tu propio contenido' });
    }

    // Duplicado = mismo contenido reportado por la misma persona (sin importar el motivo)
    const yaReportado = await Reporte.exists({
      tipo: datos.tipo,
      contenido: datos.contenido,
      reportadoPor: yo
    });
    if (yaReportado) {
      return res.status(409).json({ error: 'Ya reportaste este contenido' });
    }

    const nuevo = await Reporte.create({ ...datos, reportadoPor: yo });

    logger.info('Reporte creado', { reporteId: nuevo._id.toString(), tipo: datos.tipo, contenido: datos.contenido, por: yo });
    res.status(201).json(nuevo);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/reportes?estado=pendiente&tipo=Comentario  (solo admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const filtro = {};

    if (req.query.estado) {
      if (!ESTADOS_REPORTE.includes(req.query.estado)) {
        return res.status(400).json({ error: 'Estado inválido' });
      }
      filtro.estado = req.query.estado;
    }
    if (req.query.tipo) {
      if (!TIPOS_REPORTE.includes(req.query.tipo)) {
        return res.status(400).json({ error: 'Tipo inválido' });
      }
      filtro.tipo = req.query.tipo;
    }

    const { resultado, autores } = await conDetalle(Reporte.find(filtro).sort({ createdAt: -1 }));
    res.json(resultado.map(r => formatear(r, autores)));
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/reportes/:id  (solo admin)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const { resultado: reporte, autores } = await conDetalle(Reporte.findById(req.params.id));
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

    res.json(formatear(reporte, autores));
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/reportes/:id  solo el admin cambia el estado: pendiente o revisado
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const reporte = await Reporte.findById(req.params.id);
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

    if (reporte.estado === 'eliminado') {
      return res.status(409).json({ error: 'El contenido de este reporte ya fue eliminado' });
    }

    const { error, datos } = validarEstadoReporte(req.body);
    if (error) return res.status(400).json({ error });

    reporte.set(datos);
    await reporte.save();

    logger.info('Reporte actualizado', { reporteId: req.params.id, estado: datos.estado, por: usuarioActual(req).id });
    res.json(reporte);
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/reportes/:id  (solo admin el borra solo el reporte, no el contenido
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const reporte = await Reporte.findById(req.params.id);
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

    await reporte.deleteOne();

    logger.info('Reporte eliminado', { reporteId: req.params.id, por: usuarioActual(req).id });
    res.json({ mensaje: 'Reporte eliminado' });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/reportes/:id/eliminar-contenido  (solo admin)
// borra el contenido reportado
// los reportes sobre ese contenido se conservan como historial con estado "eliminado".
router.post('/:id/eliminar-contenido', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const reporte = await Reporte.findById(req.params.id);
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

    if (reporte.estado === 'eliminado') {
      return res.status(409).json({ error: 'El contenido de este reporte ya fue eliminado' });
    }

    const opts = { conservarReportes: true };
    const { tipo, contenido } = reporte;

    if (tipo === 'Pelicula') {
      await borrarPelicula(contenido, opts);
    } else if (tipo === 'Resena') {
      const resena = await Resena.findById(contenido).select('pelicula');
      if (resena) {
        await borrarResenas({ _id: contenido }, opts);
        await recalcular(resena.pelicula);
      }
    } else if (tipo === 'Comentario') {
      await borrarComentarios({ _id: contenido }, opts);
    } else if (tipo === 'MensajeForo') {
      await borrarMensajesForo({ _id: contenido }, opts);
    }

    // por si el contenido ya no existía, igual se cierra el caso
    await Reporte.updateMany({ tipo, contenido }, { estado: 'eliminado' });

    logger.info('Contenido reportado eliminado por moderación', {
      reporteId: req.params.id, tipo, contenido: String(contenido), por: usuarioActual(req).id
    });
    res.json({ mensaje: 'Contenido eliminado' });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
