require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); // Esta librería viene con Node.js, ayuda con las rutas de carpetas

const app = express();
const PORT = 3000;

// 1. Middlewares para recibir datos de formularios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. HACER PÚBLICAS TUS CARPETAS (Pon el nombre exacto de tus carpetas aquí)
// Esto hace que tus HTML puedan encontrar sus CSS y sus JS correspondientes
app.use('/css', express.static(path.join(__dirname, 'cinescore', 'css')));
app.use('/js', express.static(path.join(__dirname, 'cinescore', 'js')));
app.use(express.static(path.join(__dirname, 'cinescore', 'html')));
app.use('/html', express.static(path.join(__dirname, 'cinescore', 'html')));

// 3. Conexión a tu MongoDB Compass
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🚀 ¡Conexión exitosa a MongoDB Compass realizada!'))
  .catch(err => console.error('❌ Error al conectar a la base de datos:', err));

// 4. Ruta para mostrar tu ventana principal al entrar a http://localhost:3000
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'cinescore', 'html', 'explorar.html')); 
});

// 5. Encender Servidor
app.listen(PORT, () => {
  console.log(`💻 Servidor corriendo en http://localhost:${PORT}`);
});