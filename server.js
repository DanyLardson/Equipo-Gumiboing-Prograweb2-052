require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); //libreria de Node.js para ayudar con las rutas de carpetas

const app = express();
const PORT = 3000;

//formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Para hacer las carpetas publicas
app.use('/css', express.static(path.join(__dirname, 'cinescore', 'css')));
app.use('/js', express.static(path.join(__dirname, 'cinescore', 'js')));
app.use(express.static(path.join(__dirname, 'cinescore', 'html')));
app.use('/html', express.static(path.join(__dirname, 'cinescore', 'html')));

// Pa conectar a MongoDB pa Compass
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conexión exitosa a MongoDB Compass'))
  .catch(err => console.error('❌ Error al conectar a la base de datos:', err));

//Ruta para poner la ventana principal y entrr a http://localhost:3000
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'cinescore', 'html', 'explorar.html')); 
});

//Servidor funcionando
app.listen(PORT, () => {
  console.log(`💻 Servidor corriendo en http://localhost:${PORT}`);
});