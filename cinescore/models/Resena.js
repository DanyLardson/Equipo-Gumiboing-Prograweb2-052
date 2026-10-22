const mongoose = require('mongoose');
const { Schema } = mongoose;

// Colección: resenas
// Usada por escribir-resena.html (stars.js) y detalle.html (likes.js)

const ResenaSchema = new Schema({
  usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  pelicula: { type: Schema.Types.ObjectId, ref: 'Pelicula', required: true },

  calificacion: { type: Number, required: true, min: 1, max: 5 }, // stars.js
  titulo: { type: String, required: true, trim: true },
  texto: { type: String, required: true },

  likes: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }],
}, { timestamps: true });

// Un usuario solo puede reseñar una vez la misma película
ResenaSchema.index({ usuario: 1, pelicula: 1 }, { unique: true });

module.exports = mongoose.model('Resena', ResenaSchema);
