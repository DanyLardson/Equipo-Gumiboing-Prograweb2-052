const express = require('express');
const mongoose = require('mongoose');
const { Amistad, Usuario, Resena } = require('../models');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();

// Escapa los símbolos especiales para usar el texto del buscador dentro de un $regex
function escaparRegex(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// GET /api/amigos -> mis amigos y mis solicitudes pendientes
router.get('/', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;

    const amistades = await Amistad.find({
      estado: { $in: ['pendiente', 'aceptada'] },
      $or: [{ solicitante: yo }, { destinatario: yo }]
    })
      .populate('solicitante', 'username avatar')
      .populate('destinatario', 'username avatar')
      .sort({ updatedAt: -1 });

    const amigos = [];
    const recibidas = [];
    const enviadas = [];

    for (const a of amistades) {
      const meSolicitaron = a.destinatario && a.destinatario._id.toString() === yo;
      const otro = meSolicitaron ? a.solicitante : a.destinatario;
      if (!otro) continue; // el otro usuario ya no existe

      const item = { amistadId: a._id, usuario: otro };
      if (a.estado === 'aceptada') amigos.push(item);
      else if (meSolicitaron) recibidas.push(item);
      else enviadas.push(item);
    }

    res.json({ amigos, recibidas, enviadas });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// GET /api/amigos/buscar?q=texto -> usuarios y su relación conmigo
router.get('/buscar', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;
    const q = (req.query.q || '').trim();

    const filtro = { _id: { $ne: yo } };
    if (q) filtro.username = { $regex: escaparRegex(q), $options: 'i' };

    const usuarios = await Usuario.find(filtro).select('username avatar').limit(20);
    const ids = usuarios.map(u => u._id);

    // Relación con cada uno (en cualquiera de las dos direcciones)
    const amistades = await Amistad.find({
      estado: { $in: ['pendiente', 'aceptada'] },
      $or: [
        { solicitante: yo, destinatario: { $in: ids } },
        { destinatario: yo, solicitante: { $in: ids } }
      ]
    });
    const relaciones = new Map();
    for (const a of amistades) {
      const fueYo = a.solicitante.toString() === yo;
      const otroId = (fueYo ? a.destinatario : a.solicitante).toString();
      let relacion = 'amigos';
      if (a.estado === 'pendiente') relacion = fueYo ? 'enviada' : 'recibida';
      relaciones.set(otroId, { relacion, amistadId: a._id });
    }

    // Cuántas reseñas tiene cada usuario
    const conteos = await Resena.aggregate([
      { $match: { usuario: { $in: ids } } },
      { $group: { _id: '$usuario', total: { $sum: 1 } } }
    ]);
    const totales = new Map(conteos.map(c => [c._id.toString(), c.total]));

    res.json(usuarios.map(u => {
      const rel = relaciones.get(u._id.toString());
      return {
        _id: u._id,
        username: u.username,
        avatar: u.avatar,
        resenas: totales.get(u._id.toString()) || 0,
        relacion: rel ? rel.relacion : 'ninguna',
        amistadId: rel ? rel.amistadId : null
      };
    }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// POST /api/amigos  { destinatario } -> enviar solicitud
router.post('/', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;
    const { destinatario } = req.body;

    if (!mongoose.isValidObjectId(destinatario)) {
      return res.status(400).json({ error: 'Usuario inválido' });
    }
    if (destinatario === yo) {
      return res.status(400).json({ error: 'No puedes agregarte a ti mismo' });
    }
    if (!(await Usuario.exists({ _id: destinatario }))) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // ¿Ya existe una relación en cualquier dirección?
    const existente = await Amistad.findOne({
      estado: { $in: ['pendiente', 'aceptada'] },
      $or: [
        { solicitante: yo, destinatario },
        { solicitante: destinatario, destinatario: yo }
      ]
    });
    if (existente) {
      return res.status(409).json({ error: 'Ya existe una solicitud o amistad con este usuario' });
    }

    const nueva = await Amistad.create({ solicitante: yo, destinatario });
    res.status(201).json(nueva);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Ya existe una solicitud con este usuario' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// PUT /api/amigos/:id  { estado: 'aceptada' | 'rechazada' } -> responder una solicitud
router.put('/:id', requireLogin, async (req, res) => {
  try {
    const yo = req.session.userId;
    const { estado } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Id inválido' });
    }
    if (!['aceptada', 'rechazada'].includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const amistad = await Amistad.findById(req.params.id);
    if (!amistad) return res.status(404).json({ error: 'Solicitud no encontrada' });

    // Solo quien RECIBIÓ la solicitud puede responderla
    if (amistad.destinatario.toString() !== yo) {
      return res.status(403).json({ error: 'No puedes responder esta solicitud' });
    }
    if (amistad.estado !== 'pendiente') {
      return res.status(409).json({ error: 'Esta solicitud ya fue respondida' });
    }

    if (estado === 'aceptada') {
      amistad.estado = 'aceptada';
      await amistad.save();
      return res.json(amistad);
    }

    // Rechazada: se borra para que en el futuro puedan volver a intentarlo
    await amistad.deleteOne();
    res.json({ mensaje: 'Solicitud rechazada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;