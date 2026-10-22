const mongoose = require('mongoose');
const { Schema } = mongoose;

// Colección: conversaciones
// Usada por chat.html
const ConversacionSchema = new Schema({
  //Es para chats 1 a 1
  participantes: [{ type: Schema.Types.ObjectId, ref: 'Usuario', required: true }],
}, { timestamps: true });

module.exports = mongoose.model('Conversacion', ConversacionSchema);
