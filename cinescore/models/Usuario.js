const mongoose = require('mongoose');
const { Schema } = mongoose;

// Colección: usuarios
// Se relaciona con: Pelicula (creadoPor), Resena, Comentario, Foro,
// MensajeForo, Amistad, Conversacion, MensajeChat, Reporte.
const UsuarioSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // guardar siempre con hash (bcrypt)
  avatar: { type: String, default: '' },
  bio: { type: String, default: '', maxlength: 300 },
  rol: { type: String, enum: ['usuario', 'admin'], default: 'usuario' },
}, { timestamps: true });

module.exports = mongoose.model('Usuario', UsuarioSchema);
