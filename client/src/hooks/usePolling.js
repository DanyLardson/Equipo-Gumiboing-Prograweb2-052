import { useEffect, useRef } from 'react';

// llama a fn cada ms milisegundos mientras la pestaña esté visible
export function usePolling(fn, ms) {
  const guardada = useRef(fn);

  useEffect(() => {
    guardada.current = fn;
  });

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') guardada.current();
    }, ms);
    return () => clearInterval(id);
  }, [ms]);
}
