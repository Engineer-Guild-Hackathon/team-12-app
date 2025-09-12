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
    borderRadius: '8px',
    border: 'none',

    '&.MuiButton-outlined': { // 非選択中のスタイル
      backgroundColor: 'kinako.100',
      color: 'kinako.900',
      boxShadow: 'none',
    },
    '&.MuiButton-contained': {
      backgroundColor: 'yomogi.800',
      color: 'gray.100',
      boxShadow: 'none',
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
          <Typography sx={{fontSize: '20'}}>フィルター</Typography>
          <PiXBold size={24} onClick={onClose} style={{ cursor: 'pointer' }} />
        </Box>
        <Divider sx={{ mb: 2 }}/>

        <Stack spacing={3}>
          {/* 並び替えセクション (/list のみで表示) */}
          {isSortEnabled && (
            <Box>
              <Typography sx={{ mb: 1.5, fontSize: '18'}}>並び替え</Typography>
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
            <Typography sx={{ mb: 1.5, fontSize: '18' }}>はっけんした人</Typography>
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