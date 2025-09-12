"use client";

import {
  Button,
  ButtonProps,
  CircularProgress,
  styled,
  Typography,
} from "@mui/material";
import React from "react";

const StyledSubmitButton = styled(Button)(({ theme }) => ({
  borderRadius: 200,
  backgroundColor: theme.palette.kinako[900],
  color: theme.palette.gray[100],
  paddingTop: theme.spacing(1.6),
  paddingBottom: theme.spacing(1.6),
  boxShadow: "none",
  textTransform: "none",
  width: "80%",
  alignSelf: "center",
  "&:hover": {
    transform: "translateY(-3px) scale(1.02)",
    boxShadow: "none",
    backgroundColor: theme.palette.kinako[900],
  },
  "&.Mui-disabled": {
    backgroundColor: theme.palette.kinako[700],
    color: theme.palette.gray[100],
  },
}));

interface SubmitButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
}

export default function SubmitButton({
  isLoading = false,
  loadingText = "送信中...",
  children,
  ...props
}: SubmitButtonProps) {
  return (
    <StyledSubmitButton
      type="submit"
      variant="contained"
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
      )}
      <Typography fontSize={20}>
        {isLoading ? loadingText : children}
      </Typography>
    </StyledSubmitButton>
  );
}
