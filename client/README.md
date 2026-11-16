Front end de CineScore: React + Vite + Material UI + React Router.
Habla solo con el backend (Express) por JSON, mandando el token JWT en cada petición.



Se necesitan abrir 2 terminales

```bash
# el backend en http://localhost:3000
npm run dev

# el front en http://localhost:5173
cd client
npm install      # solo la primera vez para descargar las cosas
npm run dev
```

Vite reenvía `/api` al backend (ver `vite.config.js`), así no hay problemas de CORS.

# lo nuebo

```
src/
├── main.jsx            punto de entrada (tema, router, AuthProvider)
├── App.jsx             rutas de la aplicación
├── theme.js            tema de Material UI (osea el diseño de la página)
├── context/            AuthContext: usuario, login, registro, logout
├── services/api.js     único lugar que habla con el backend (agrega el token)
├── components/         Layout (menú), Rutas (públicas / privadas / admin)
├── hooks/              useApi: GET con estado de carga y error
├── pages/              una pantalla por archivo
└── utils/              validaciones de formularios
```
