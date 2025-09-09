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
});

export default theme;
