import { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

// ventana de confirmación para acciones que no se pueden deshacer.
export default function Confirmar({ titulo, texto, textoBoton = 'Eliminar', onCerrar, onConfirmar }) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  async function confirmar() {
    setError('');
    try {
      setEnviando(true);
      await onConfirmar();
    } catch (err) {
      setError(err.message);
      setEnviando(false);
    }
  }

  return (
    <Dialog open onClose={enviando ? undefined : onCerrar} fullWidth maxWidth="xs">
      <DialogTitle>{titulo}</DialogTitle>
      <DialogContent>
        <DialogContentText>{texto}</DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button variant="contained" color="error" onClick={confirmar} disabled={enviando}>
          {enviando ? 'Un momento...' : textoBoton}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
