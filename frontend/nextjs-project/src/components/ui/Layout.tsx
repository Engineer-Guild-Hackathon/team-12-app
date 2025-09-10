"use client";

import { Container } from "@mui/material";
import React from "react";
import { MOBILE_MAX_WIDTH } from "@/constants/styles";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        maxWidth: `${MOBILE_MAX_WIDTH}px`,
        margin: "0 auto",
        padding: 0,
        backgroundColor: "kinako.100",
        minHeight: "100vh",
      }}
    >
      {children}
    </Container>
  );
}
