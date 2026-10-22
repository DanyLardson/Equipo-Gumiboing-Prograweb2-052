const mongoose = require('mongoose');
const { Schema } = mongoose;

// Colección: reportes
// Usada por admin.html / admin.js
// Referencia dinámica al contenido reportado usando refPath, ya que un
// reporte puede apuntar a una Resena, un Comentario o un MensajeForo.
const ReporteSchema = new Schema({
  tipo: {
    type: String,
    required: true,
    enum: ['Resena', 'Comentario', 'MensajeForo'],
  },
  contenido: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: 'tipo', // usa el valor de "tipo" para saber a qué colección apunta
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
