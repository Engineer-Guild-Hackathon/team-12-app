'use client';

import { Container } from '@mui/material';
import React from 'react';

const MOBILE_MAX_WIDTH = 500;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Container
      maxWidth={false}
      sx={{
        maxWidth: `${MOBILE_MAX_WIDTH}px`,
        margin: '0 auto',
        padding: 0,
        backgroundColor: '#ffffff',
        minHeight: '100vh',
      }}
    >
      {children}
    </Container>
  );
}
