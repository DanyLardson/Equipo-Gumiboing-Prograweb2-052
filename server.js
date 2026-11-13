require('dotenv').config();
const logger = require('./cinescore/utils/logger');
logger.info('Iniciando servidor', { carpeta: __dirname });

// Errores que nadie capturó: se registran antes de que el proceso termine
process.on('uncaughtException', (err) => {
  logger.error('uncaughtException (el proceso se cerrará)', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection', reason instanceof Error ? reason : { reason: String(reason) });
});

// Si falta alguna variable del .env, avisamos claro y salimos (en vez de fallar raro después)
const variablesRequeridas = ['MONGO_URI', 'SESSION_SECRET'];
const faltantes = variablesRequeridas.filter(v => !process.env[v]);
if (faltantes.length) {
  logger.error(`Faltan variables en el archivo .env: ${faltantes.join(', ')}`);
  console.error('   Copia .env.example como .env y llena los valores.');
  process.exit(1);
}
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path'); //libreria de Node.js para ayudar con las rutas de carpetas

const app = express();
const PORT = process.env.PORT || 3000;

// Carga los modelos (así Mongoose crea las colecciones)
require('./cinescore/models');
const { protegerPaginas, protegerApi } = require('./cinescore/middleware/auth');

//formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//sesiones (deben ir antes de las rutas)
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

// Sin sesión, las páginas mandan al login (debe ir antes de los express.static)
app.use(protegerPaginas);

//Para hacer las carpetas publicas
app.use('/css', express.static(path.join(__dirname, 'cinescore', 'css')));
app.use('/js', express.static(path.join(__dirname, 'cinescore', 'js')));
app.use('/vendor/tabler', express.static(path.join(__dirname, 'node_modules', '@tabler', 'icons-webfont')));
app.use(express.static(path.join(__dirname, 'cinescore', 'html')));
app.use('/html', express.static(path.join(__dirname, 'cinescore', 'html')));

// Pa conectar a MongoDB pa Compass
mongoose.connection.on('disconnected', () => logger.warn('MongoDB desconectado'));
mongoose.connection.on('error', (err) => logger.error('Error en la conexión a MongoDB', err));

mongoose.connect(process.env.MONGO_URI)
  .then(() => logger.info('Conexión exitosa a MongoDB'))
  .catch(err => logger.error('No se pudo conectar a la base de datos', err));

//Ruta para poner la ventana principal y entrr a http://localhost:3000
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'cinescore', 'html', 'login.html'));
});

// Todo /api requiere sesión, menos registro y login
app.use('/api', (req, res, next) => {
  console.log(req.method, req.originalUrl);
  next();
});
app.use('/api', protegerApi);

//Rutas de la API
app.use('/api/auth', require('./cinescore/routes/auth'));
app.use('/api/peliculas', require('./cinescore/routes/peliculas'));
app.use('/api/resenas', require('./cinescore/routes/resenas'));
app.use('/api/foros', require('./cinescore/routes/foros'));
app.use('/api/chat', require('./cinescore/routes/chat'));
app.use('/api/amigos', require('./cinescore/routes/amigos'));
app.use('/api/comentarios', require('./cinescore/routes/comentarios'));
app.use('/api/usuarios', require('./cinescore/routes/usuarios'));

// Cualquier ruta /api que no exista responde JSON (no HTML)
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador global de errores: lo que no capturó una ruta termina aquí
app.use((err, req, res, next) => {
  // JSON mal formado en el body
  if (err.type === 'entity.parse.failed') {
    logger.warn(`JSON inválido en ${req.method} ${req.originalUrl}`);
    return res.status(400).json({ error: 'El cuerpo de la petición no es un JSON válido' });
  }
  logger.error(`Error no controlado en ${req.method} ${req.originalUrl}`, err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Error del servidor' });
});

//Servidor funcionando
const server = app.listen(PORT, () => {
  logger.info(`Servidor corriendo en http://localhost:${PORT}`);
});

// Apagado ordenado (Ctrl+C o cierre del proceso): queda registrado el fin
async function apagar(senal) {
  logger.info(`Señal ${senal} recibida: cerrando servidor`);
  server.close(async () => {
    try {
      await mongoose.disconnect();
    } catch (err) {
      logger.error('Error al cerrar MongoDB', err);
    }
    logger.info('Servidor detenido');
    process.exit(0);
  });
}
process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));