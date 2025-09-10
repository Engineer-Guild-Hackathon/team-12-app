'use client';

import { Box, Typography } from "@mui/material";
import React from "react";
import { HEADER_HEIGHT } from '@/constants/styles';
import { usePathname } from "next/navigation";
import Header from "@/components/features/header/Header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // 共通のタブスタイルを変数として切り出し
  const tabStyles = {
    flexGrow: 1, // タブが均等に幅を広げる
    borderRadius: '8px 8px 0px 0px',
    fontSize: '1rem',
    '&.Mui-selected': {
      backgroundColor: 'yomogi.800',
      color: 'gray.100',
    },
  };

  return (
    <>
      <Header />



      {/* メインコンテンツ */}
      <Box
        component="main"
        sx={{
          height: '1500px',
          mt: `${HEADER_HEIGHT}px`,
        }}
      >
        {children}
      </Box>

      {/* フッター */}
      <Box
        component="footer"
        sx={{
          py: 2, // 上下の余白
          px: 2,
          mt: 'auto', // フッターを最下部に押し出すための設定
          backgroundColor: '#f5f5f5',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} Michikusa. All rights reserved.
        </Typography>
      </Box>
    </>
  );
}
