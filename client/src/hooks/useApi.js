import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

// hace un GET al abrir la pantalla y devuelve datos, error, cargando, recargar.
export function useApi(ruta) {
  const [estado, setEstado] = useState({ ruta, datos: null, error: '', cargando: true });
  const [version, setVersion] = useState(0);
  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let activo = true;
    setEstado((previo) =>
      previo.ruta === ruta ? previo : { ruta, datos: null, error: '', cargando: true }
    );

    api.get(ruta)
      .then((datos) => {
        if (activo) setEstado({ ruta, datos, error: '', cargando: false });
      })
      .catch((err) => {
        if (activo) setEstado({ ruta, datos: null, error: err.message, cargando: false });
      });

    return () => {
      activo = false;
    };
  }, [ruta, version]);

  // si la ruta cambió pero el efecto aún no corrió, se considera "cargando" 
  const vigente = estado.ruta === ruta;
  return {
    datos: vigente ? estado.datos : null,
    error: vigente ? estado.error : '',
    cargando: vigente ? estado.cargando : true,
    recargar
  };
}
