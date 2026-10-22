const mongoose = require('mongoose');
const { Schema } = mongoose;

// Colección: comentarios
// Comentarios dentro de una Resena
const ComentarioSchema = new Schema({
  resena: { type: Schema.Types.ObjectId, ref: 'Resena', required: true },
  usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  texto: { type: String, required: true },
  likes: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }], // likes.js
}, { timestamps: true });

module.exports = mongoose.model('Comentario', ComentarioSchema);
