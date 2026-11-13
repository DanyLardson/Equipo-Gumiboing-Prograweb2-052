// Crear el admin.
// Si ya existe un usuario con ADMIN_EMAIL -> se le cambia el rol a "admin"
// npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const logger = require('./logger');
const { Usuario } = require('../models');

async function main() {
  if (!process.env.MONGO_URI) {
    logger.error('falta MONGO_URI en el archivo .env');
    process.exit(1);
  }

  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  if (!email) {
    logger.error('falta ADMIN_EMAIL en el archivo .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  logger.info('Crear admin', { email });

  const existente = await Usuario.findOne({ email });

  if (existente) {
    if (existente.rol === 'admin') {
      logger.info('El usuario ya es admin', { email });
    } else {
      await Usuario.updateOne({ _id: existente._id }, { rol: 'admin' });
      logger.info('El usuario ha sido promovido a Admin', { email, username: existente.username });
    }
  } else {
    const username = (process.env.ADMIN_USERNAME || '').trim();
    const password = process.env.ADMIN_PASSWORD || '';

    if (!username || !password) {
      logger.error('El usuario no existe');
      await mongoose.disconnect();
      process.exit(1);
    }
    if (password.length < 6) {
      logger.error('La contraseña debe tener al menos 6 caracteres');
      await mongoose.disconnect();
      process.exit(1);
    }

    const hash = await bcrypt.hash(password, 10);
    await Usuario.create({ username, email, password: hash, rol: 'admin' });
    logger.info('Admin creado', { email, username });
  }

  await mongoose.disconnect();
}

main().catch(async (err) => {
  if (err.code === 11000) {
    logger.error('El usuario o correo ya está en uso por otro usuario', { clave: err.keyValue });
  } else {
    logger.error('Seed: falló', err);
  }
  try { await mongoose.disconnect(); } catch (e) { /* ya estaba cerrada */ }
  process.exit(1);
});