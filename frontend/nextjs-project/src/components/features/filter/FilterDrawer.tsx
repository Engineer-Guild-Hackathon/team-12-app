"use client";

import {
  SwipeableDrawer,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { PiCheckBold, PiXBold } from "react-icons/pi";

const sortOptions = [
  { value: "newest", label: "新しい順" },
  { value: "nearest", label: "近い順" },
  { value: "oldest", label: "古い順" },
  { value: "recommended", label: "おすすめ順" },
];

type FilterDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  currentSort: string;
  onSortChange: (sortValue: string) => void;
};

export default function FilterDrawer({
  isOpen,
  onClose,
  onOpen,
  currentSort,
  onSortChange,
}: FilterDrawerProps) {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={isOpen}
      onClose={onClose}
      onOpen={onOpen}
      // 角丸のデザイン
      sx={{ '& .MuiDrawer-paper': { borderRadius: '16px 16px 0 0' } }}
    >
      <Box sx={{ width: 'auto', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div">並び替え</Typography>
          <PiXBold size={24} onClick={onClose} style={{ cursor: 'pointer' }}/>
        </Box>
        <Divider />
        <List>
          {sortOptions.map((option) => (
            <ListItem key={option.value} disablePadding>
              <ListItemButton onClick={() => onSortChange(option.value)}>
                {/* 選択中の項目にチェックマークを表示 */}
                <ListItemIcon sx={{ minWidth: '40px', color: 'yomogi.600' }}>
                  {currentSort === option.value && <PiCheckBold />}
                </ListItemIcon>
                <ListItemText primary={option.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </SwipeableDrawer>
  );
}