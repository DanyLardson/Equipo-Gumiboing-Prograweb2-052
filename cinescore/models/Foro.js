const mongoose = require('mongoose');
const { Schema } = mongoose;

// Colección: foros
// Usada por crear-foro.html, foros.html, foro.html
const ForoSchema = new Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, default: '' },

  pelicula: { type: Schema.Types.ObjectId, ref: 'Pelicula', required: true },
  creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Foro', ForoSchema);
