"use client";

import { Button, ButtonProps, styled, Typography, Box } from "@mui/material";
import React from "react";
import LeafyLoader from "@/components/features/loading/LeafyLoader"; // 作成したローダーをインポート

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
        <Box
          sx={{
            display: "flex",
            justifyContent: "center", // 横方向の中央揃え
            alignItems: "center", // 縦方向の中央揃え
            height: "100svh", // 親要素の高さ全体を使う
            width: "100%", // 親要素の幅全体を使う
          }}
        >
          <LeafyLoader />
        </Box>
      )}
      <Typography fontSize={20}>
        {isLoading ? loadingText : children}
      </Typography>
    </StyledSubmitButton>
  );
}
