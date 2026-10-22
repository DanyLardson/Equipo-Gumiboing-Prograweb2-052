const mongoose = require('mongoose');
const { Schema } = mongoose;

// Colección: mensajes_chat
// Usada por chat.html / chat.js (por ahora demo local, aquí queda listo
const MensajeChatSchema = new Schema({
  conversacion: { type: Schema.Types.ObjectId, ref: 'Conversacion', required: true },
  emisor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  texto: { type: String, required: true },
  leido: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('MensajeChat', MensajeChatSchema);
