'use client';
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  cssVariables: true,
  typography: {
    fontFamily: [
      'var(--font-yomogi)',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Hiragino Sans"',
      '"Noto Sans CJK JP"',
      '"Yu Gothic UI"',
      'Meiryo',
      'sans-serif',
    ].join(','),
  },
  palette: {
    kinako: {
      '100': '#F6F1E6',
      '200': '#F4EAD5',
      '300': '#E8E1D1',
      '400': '#DBC597',
      '600': '#AD9055',
      '700': '#B8B09D',
      '800': '#62573E',
      '900': '#322508',
      main: '#322508',
    },
    yomogi: {
      '200': '#E3EBC3',
      '400': '#CCD6A6',
      '600': '#B2BE83',
      '800': '#85934E',
      '900': '#505C22',
      main: '#85934E',
    },
    tamago: {
      '200': '#FFFBE9',
      '400': '#FBF0BB',
      '600': '#F5E492',
      main: '#F5E492',
    },
    gray: {
      '100': '#FFFFFF',
      '200': '#E9E9E9',
      '400': '#B4B4B4',
      '900': '#000000',
      main: '#FFFFFF',
    },
    background: {
      default: '#CCD6A6',
    },
  },
});

export default theme;
