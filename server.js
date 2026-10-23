require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path'); //libreria de Node.js para ayudar con las rutas de carpetas

const app = express();
const PORT = 3000;

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
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conexión exitosa a MongoDB Compass'))
  .catch(err => console.error('❌ Error al conectar a la base de datos:', err));

//Ruta para poner la ventana principal y entrr a http://localhost:3000
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'cinescore', 'html', 'login.html'));
});

// Todo /api requiere sesión, menos registro y login
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
app.use('/api/amigos', require('./cinescore/routes/amigos'));

//Servidor funcionando
app.listen(PORT, () => {
  console.log(`💻 Servidor corriendo en http://localhost:${PORT}`);
});