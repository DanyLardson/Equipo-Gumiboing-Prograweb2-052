require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path'); //libreria de Node.js para ayudar con las rutas de carpetas

const app = express();
const PORT = 3000;

const { Usuario, Pelicula, Resena, Comentario, Foro, MensajeForo, Amistad, Conversacion, MensajeChat, Reporte} = require('./cinescore/models');

//formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

//Para hacer las carpetas publicas
app.use('/css', express.static(path.join(__dirname, 'cinescore', 'css')));
app.use('/js', express.static(path.join(__dirname, 'cinescore', 'js')));
app.use(express.static(path.join(__dirname, 'cinescore', 'html')));
app.use('/html', express.static(path.join(__dirname, 'cinescore', 'html')));
//Pa las estrellitas
app.use('/vendor/tabler', express.static(path.join(__dirname, 'node_modules', '@tabler', 'icons-webfont')));

// Pa conectar a MongoDB pa Compass
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conexión exitosa a MongoDB Compass'))
  .catch(err => console.error('❌ Error al conectar a la base de datos:', err));

//Ruta para poner la ventana principal y entrr a http://localhost:3000
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'cinescore', 'html', 'registro.html')); 
});

//Rutas de la API
app.use('/api/auth', require('./cinescore/routes/auth'));
app.use('/api/peliculas', require('./cinescore/routes/peliculas'));
app.use('/api/resenas', require('./cinescore/routes/resenas'));

//Servidor funcionando
app.listen(PORT, () => {
  console.log(`💻 Servidor corriendo en http://localhost:${PORT}`);
});