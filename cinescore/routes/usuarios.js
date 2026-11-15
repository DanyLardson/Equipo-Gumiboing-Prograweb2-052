const express = require('express');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { Usuario, Resena, Comentario } = require('../models');
const { requireLogin, requireAdmin } = require('../middleware/auth');
const { usuarioActual, esAdmin } = require('../utils/permisos');
const { validarPerfil, validarCambioPassword } = require('../utils/validaciones');
const { borrarUsuario } = require('../utils/cascada');
const { recalcular } = require('./resenas');

const router = express.Router();

const MSJ_DUPLICADO = 'Ese correo o nombre de usuario ya está en uso';

// sespués de borrar un usuario, sus reseñas dejaron de contar en el promedio
async function recalcularPeliculas(peliculas) {
  for (const peliculaId of peliculas) {
    await recalcular(peliculaId);
  }
}

// GET /api/usuarios/me  datos del perfil, estadísticas y reseñas recientes
router.get('/me', requireLogin, async (req, res) => {
  try {
    const id = req.user.id;

    const usuario = await Usuario.findById(id).select('-password');
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });

    const [totalResenas, totalComentarios, recientes, likesAgg] = await Promise.all([
      Resena.countDocuments({ usuario: id }),
      Comentario.countDocuments({ usuario: id }),
      Resena.find({ usuario: id })
        .populate('pelicula', 'titulo poster')
        .sort({ createdAt: -1 })
        .limit(10),
      // suma de likes que han recibido sus reseñas
      Resena.aggregate([
        { $match: { usuario: new mongoose.Types.ObjectId(id) } },
        { $project: { n: { $size: '$likes' } } },
        { $group: { _id: null, total: { $sum: '$n' } } }
      ])
    ]);

    res.json({
      usuario,
      stats: {
        resenas: totalResenas,
        comentarios: totalComentarios,
        likes: likesAgg.length ? likesAgg[0].total : 0
      },
      recientes: recientes.map(r => ({
        _id: r._id,
        titulo: r.titulo,
        calificacion: r.calificacion,
        createdAt: r.createdAt,
        pelicula: r.pelicula // puede ser null si la película se borró
      }))
    });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/usuarios/me  editar mi perfil: username, email, bio, avatar
router.put('/me', requireLogin, async (req, res) => {
  try {
    const { error, datos } = validarPerfil(req.body);
    if (error) return res.status(400).json({ error });

    const usuario = await Usuario.findByIdAndUpdate(
      usuarioActual(req).id,
      datos,
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });

    logger.info('Perfil actualizado', { userId: String(usuario._id), campos: Object.keys(datos) });
    res.json(usuario);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: MSJ_DUPLICADO });
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/usuarios/me/password  si la contraseña esta mal marca error
router.put('/me/password', requireLogin, async (req, res) => {
  try {
    const { error, datos } = validarCambioPassword(req.body);
    if (error) return res.status(400).json({ error });

    const usuario = await Usuario.findById(usuarioActual(req).id);
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });

    if (!(await bcrypt.compare(datos.passwordActual, usuario.password))) {
      logger.warn('Cambio de contraseña con contraseña actual incorrecta', { userId: String(usuario._id) });
      return res.status(400).json({ error: 'La contraseña actual es incorrecta' });
    }

    usuario.password = await bcrypt.hash(datos.passwordNueva, 10);
    await usuario.save();

    logger.info('Contraseña actualizada', { userId: String(usuario._id) });
    res.json({ mensaje: 'Contraseña actualizada' });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/usuarios/me  elimina mi cuenta y todo lo mío
router.delete('/me', requireLogin, async (req, res) => {
  try {
    const id = usuarioActual(req).id;
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!password) return res.status(400).json({ error: 'Escribe tu contraseña para eliminar tu cuenta' });

    const usuario = await Usuario.findById(id);
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });

    if (!(await bcrypt.compare(password, usuario.password))) {
      logger.warn('Intento de eliminar cuenta con contraseña incorrecta', { userId: id });
      return res.status(400).json({ error: 'La contraseña es incorrecta' });
    }

    // nunca c debe quedar el sistema sin admin
    if (usuario.rol === 'admin' && (await Usuario.countDocuments({ rol: 'admin' })) <= 1) {
      return res.status(409).json({ error: 'Eres el único admin: asigna otro admin antes de eliminar tu cuenta' });
    }

    logger.info('Eliminando cuenta', { userId: id });
    const { peliculasAfectadas } = await borrarUsuario(usuario._id);
    await recalcularPeliculas(peliculasAfectadas);

    // con token no hay nada que cerrar en el servidor
    if (req.session) {
      req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ mensaje: 'Cuenta eliminada' });
      });
    } else {
      res.json({ mensaje: 'Cuenta eliminada' });
    }
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/usuarios?q=texto&rol=admin  solo admin, lista de usuarios
router.get('/', requireAdmin, async (req, res) => {
  try {
    const filtro = {};

    if (req.query.rol) {
      if (!['usuario', 'admin'].includes(req.query.rol)) {
        return res.status(400).json({ error: 'Rol inválido' });
      }
      filtro.rol = req.query.rol;
    }
    if (req.query.q) {
      const q = String(req.query.q).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filtro.$or = [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const usuarios = await Usuario.find(filtro).select('-password').sort({ createdAt: -1 }).limit(200);
    res.json(usuarios);
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/usuarios/:id perfil público (el admin y el propio usuario ven también correo y rol)
router.get('/:id', requireLogin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    const [resenas, comentarios] = await Promise.all([
      Resena.countDocuments({ usuario: usuario._id }),
      Comentario.countDocuments({ usuario: usuario._id })
    ]);

    const privado = esAdmin(req) || String(usuario._id) === String(usuarioActual(req).id);
    const respuesta = {
      _id: usuario._id,
      username: usuario.username,
      avatar: usuario.avatar,
      bio: usuario.bio,
      createdAt: usuario.createdAt,
      stats: { resenas, comentarios }
    };
    if (privado) {
      respuesta.email = usuario.email;
      respuesta.rol = usuario.rol;
    }

    res.json(respuesta);
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/usuarios/:id  (solo admin: username, email, bio, avatar y rol de cualquier usuario)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }

    const { error, datos } = validarPerfil(req.body, { admin: true });
    if (error) return res.status(400).json({ error });

    if (datos.rol && req.params.id === usuarioActual(req).id) {
      return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      datos,
      { new: true, runValidators: true }
    ).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    logger.info('Usuario actualizado por admin', {
      usuarioId: req.params.id, campos: Object.keys(datos), por: usuarioActual(req).id
    });
    res.json(usuario);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: MSJ_DUPLICADO });
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// DELETE /api/usuarios/:id  solo el admin puede eliminar al usuario y todo lo suyo
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }
    if (req.params.id === usuarioActual(req).id) {
      return res.status(400).json({ error: 'Para eliminar tu propia cuenta usa la opción de tu perfil' });
    }

    const usuario = await Usuario.findById(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (usuario.rol === 'admin') {
      return res.status(403).json({ error: 'No puedes eliminar a otro admin: cámbiale el rol primero' });
    }

    logger.info('Eliminando usuario (admin)', { usuarioId: req.params.id, por: usuarioActual(req).id });
    const { peliculasAfectadas } = await borrarUsuario(usuario._id);
    await recalcularPeliculas(peliculasAfectadas);

    res.json({ mensaje: 'Usuario eliminado' });
  } catch (err) {
    logger.error(`${req.method} ${req.originalUrl}`, err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
