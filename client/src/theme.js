import { createTheme } from '@mui/material/styles';

// diseño
export const colores = {
  rojo: '#E4423F',
  dorado: '#F2B134',
  noche: '#14141F',
  crema: '#F3F0E8'
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: colores.rojo, contrastText: '#ffffff' },
    secondary: { main: colores.dorado, contrastText: colores.noche },
    background: { default: colores.crema, paper: '#ffffff' },
    text: { primary: '#1A1A24', secondary: '#5c5c6b' }
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 },
    h2: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 },
    h3: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 },
    h4: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 },
    h5: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 },
    h6: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 }
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: { root: { borderColor: '#e6e2d8' } }
    }
  }
});

export default theme;
