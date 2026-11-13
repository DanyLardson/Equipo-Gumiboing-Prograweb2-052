// Logger a archivo para CineScore (sin dependencias externas).
// Escribe en logs/app.log y también muestra el mensaje en consola.
//
// Uso:
//   const logger = require('../utils/logger');
//   logger.info('Usuario inició sesión', { userId });
//   logger.warn('Intento de login fallido', { email });
//   logger.error('POST /api/resenas', err);
//
// Formato de cada línea:
//   2026-11-13T19:46:00.000Z [ERROR] mensaje | {"dato":"valor"}

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Crea la carpeta logs/ si no existe
try {
  fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (e) {
  console.error('No se pudo crear la carpeta de logs:', e.message);
}

// Convierte el tercer argumento (objeto, Error o texto) en texto para la línea
function formatearDetalle(detalle) {
  if (detalle === undefined || detalle === null) return '';
  if (detalle instanceof Error) {
    return ` | ${detalle.message}\n${detalle.stack}`;
  }
  if (typeof detalle === 'object') {
    try {
      return ` | ${JSON.stringify(detalle)}`;
    } catch (e) {
      return ' | [detalle no serializable]';
    }
  }
  return ` | ${detalle}`;
}

// Escritura síncrona a propósito: así no se pierde nada si el proceso
// se cae justo después (uncaughtException, apagado del servidor, etc.)
function escribir(nivel, mensaje, detalle) {
  const linea = `${new Date().toISOString()} [${nivel}] ${mensaje}${formatearDetalle(detalle)}\n`;

  try {
    fs.appendFileSync(LOG_FILE, linea);
  } catch (e) {
    console.error('No se pudo escribir en el archivo de logs:', e.message);
  }

  if (nivel === 'ERROR') console.error(linea.trimEnd());
  else if (nivel === 'WARN') console.warn(linea.trimEnd());
  else console.log(linea.trimEnd());
}

module.exports = {
  info: (mensaje, detalle) => escribir('INFO', mensaje, detalle),
  warn: (mensaje, detalle) => escribir('WARN', mensaje, detalle),
  error: (mensaje, detalle) => escribir('ERROR', mensaje, detalle),
  LOG_FILE
};
