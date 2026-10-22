const mongoose = require('mongoose');
const { Schema } = mongoose;

// Colección: amistades
// Es para buscar-amigos.html
// Ayuda a relacionar entre los usuarios
const AmistadSchema = new Schema({
  solicitante: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  destinatario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  estado: {
    type: String,
    enum: ['pendiente', 'aceptada', 'rechazada'],
    default: 'pendiente',
  },
}, { timestamps: true });

// Es para evitar solicitudes duplicadas
AmistadSchema.index({ solicitante: 1, destinatario: 1 }, { unique: true });

module.exports = mongoose.model('Amistad', AmistadSchema);
