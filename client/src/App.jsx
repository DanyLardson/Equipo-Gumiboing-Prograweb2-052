import { Route, Routes } from 'react-router-dom';
import { RutaAdmin, RutaPrivada, RutaPublica } from './components/Rutas';
import Layout from './components/Layout';
import Login from './pages/Login';
import Registro from './pages/Registro';
import Explorar from './pages/Explorar';
import Perfil from './pages/Perfil';
import PeliculaDetalle from './pages/PeliculaDetalle';
import PeliculaForm from './pages/PeliculaForm';
import Foros from './pages/Foros';
import ForoDetalle from './pages/ForoDetalle';
import ForoForm from './pages/ForoForm';
import Admin from './pages/Admin';
import NoEncontrada from './pages/NoEncontrada';

export default function App() {
  return (
    <Routes>
      {/* Sin sesión: solo login y registro */}
      <Route element={<RutaPublica />}>
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Registro />} />
      </Route>

      {/* Con sesión: todo lo demás, dentro del menú */}
      <Route element={<RutaPrivada />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Explorar />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/peliculas/nueva" element={<PeliculaForm />} />
          <Route path="/peliculas/:id" element={<PeliculaDetalle />} />
          <Route path="/peliculas/:id/editar" element={<PeliculaForm />} />
          <Route path="/foros" element={<Foros />} />
          <Route path="/foros/nuevo" element={<ForoForm />} />
          <Route path="/foros/:id" element={<ForoDetalle />} />
          <Route path="/foros/:id/editar" element={<ForoForm />} />

          {/* Solo admin */}
          <Route element={<RutaAdmin />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  );
}
