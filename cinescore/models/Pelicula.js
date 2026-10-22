const mongoose = require('mongoose');
const { Schema } = mongoose;

// Colección: peliculas
// Se usa en explorar.html, detalle.html, agregar-pelicula.html, crear-foro.html
const PeliculaSchema = new Schema({
  titulo: { type: String, required: true, trim: true },
  anio: { type: Number, required: true },
  director: { type: String, required: true, trim: true },
  genero: {
    type: String,
    required: true,
    enum: ['Drama', 'Ciencia ficción', 'Comedia', 'Suspenso', 'Terror', 'Accion', 'Animacion'],
  },
  sinopsis: { type: String, default: '' },
  poster: { type: String, default: '' }, // Es la URL de la imagen

  // Se pueden agregar varias películas
  creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },

  // Se recalcula cada vez que se crea/borra una Resena de esta película
  promedioCalificacion: { type: Number, default: 0, min: 0, max: 5 },
  totalResenas: { type: Number, default: 0 },
}, { timestamps: true });

PeliculaSchema.index({ titulo: 'text' }); // soporta el buscador de explorar.html

module.exports = mongoose.model('Pelicula', PeliculaSchema);
