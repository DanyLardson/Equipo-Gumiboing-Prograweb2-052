const mongoose = require('mongoose');
const { Schema } = mongoose;

// colección: reportes
const ReporteSchema = new Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['Pelicula', 'Resena', 'Comentario', 'MensajeForo'],
  },
  contenido: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'tipo', // usa el valor de "tipo" para saber a qué colección 
  },
  reportadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  razon: { type: String, default: '' },
  estado: {
    type: String,
    enum: ['pendiente', 'revisado', 'eliminado'],
    default: 'pendiente',
  },
}, { timestamps: true });

module.exports = mongoose.model('Reporte', ReporteSchema);
