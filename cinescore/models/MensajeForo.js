const mongoose = require('mongoose');
const { Schema } = mongoose;

// Colección: mensajes_foro
const MensajeForoSchema = new Schema({
  foro: { type: Schema.Types.ObjectId, ref: 'Foro', required: true },
  usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  texto: { type: String, required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }], // likes.js
}, { timestamps: true });

module.exports = mongoose.model('MensajeForo', MensajeForoSchema);
