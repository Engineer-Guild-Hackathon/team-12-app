"use client";

import {
  SwipeableDrawer,
  Box,
  Stack,
  Button,
  Typography,
  Divider,
} from "@mui/material";
import { PiXBold } from "react-icons/pi";

type FilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  // Sort関連
  isSortEnabled: boolean;
  currentSort: string;
  onSortChange: (value: string) => void;
  sortOptions: { value: string; label: string }[];
  // Scope関連
  currentScope: string;
  onScopeChange: (value: string) => void;
  scopeOptions: { value: string; label: string }[];
};

export default function FilterDrawer({
  isOpen, onClose, onOpen,
  isSortEnabled, currentSort, onSortChange, sortOptions,
  currentScope, onScopeChange, scopeOptions
}: FilterDrawerProps) {

  // ボタンの共通スタイル
  const buttonSx = {
    borderRadius: '20px',
    border: '1px solid',
    borderColor: 'kinako.main', // テーマに合わせて調整してください
    color: 'kinako.dark',     // テーマに合わせて調整してください
    '&.Mui-contained': { // 選択中のスタイル
      backgroundColor: 'yomogi.main', // テーマに合わせて調整してください
      color: 'white',
      borderColor: 'yomogi.main',     // テーマに合わせて調整してください
      '&:hover': {
        backgroundColor: 'yomogi.dark', // ホバー時の色
      }
    },
  };

  return (
    <SwipeableDrawer
      anchor="bottom" open={isOpen} onClose={onClose} onOpen={onOpen}
      sx={{ '& .MuiDrawer-paper': { borderRadius: '16px 16px 0 0' } }}
    >
      <Box sx={{ p: 2 }}>
        {/* ヘッダー */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div">フィルター</Typography>
          <PiXBold size={24} onClick={onClose} style={{ cursor: 'pointer' }} />
        </Box>
        <Divider sx={{ mb: 2 }}/>

        <Stack spacing={3}>
          {/* 並び替えセクション (/list のみで表示) */}
          {isSortEnabled && (
            <Box>
              <Typography sx={{ mb: 1.5, fontWeight: 'bold' }}>並び替え</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {sortOptions.map(opt => (
                  <Button key={opt.value} sx={buttonSx}
                    variant={currentSort === opt.value ? 'contained' : 'outlined'}
                    onClick={() => onSortChange(opt.value)}
                  >{opt.label}</Button>
                ))}
              </Box>
            </Box>
          )}

          {/* はっけんした人セクション */}
          <Box>
            <Typography sx={{ mb: 1.5, fontWeight: 'bold' }}>はっけんした人</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {scopeOptions.map(opt => (
                <Button key={opt.value} sx={buttonSx}
                  variant={currentScope === opt.value ? 'contained' : 'outlined'}
                  onClick={() => onScopeChange(opt.value)}
                >{opt.label}</Button>
              ))}
            </Box>
          </Box>
        </Stack>
      </Box>
    </SwipeableDrawer>
  );
}