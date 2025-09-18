"use client";

import { useState, KeyboardEvent } from "react";
import { Box, TextField, IconButton, Paper } from "@mui/material";
import { IoSearchOutline } from "react-icons/io5";

interface SearchBarProps {
  onSearch: (q: string) => void;
  initialQuery?: string;
}

/**
 * 地図の上に重ねて固定表示する検索バー
 * スタイルは最小限。UIのルールに合わせてMUIコンポーネントを使用。
 */
export default function SearchBar({ onSearch, initialQuery }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery ?? "");

  const triggerSearch = () => {
    const q = query.trim();
    if (!q) return;
    onSearch(q);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      triggerSearch();
    }
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        zIndex: 1000,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Paper elevation={3} sx={{ width: "100%", maxWidth: 560, p: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <TextField
            id="search-bar"
            fullWidth
            size="small"
            placeholder="検索ワードを入力"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            inputProps={{ "aria-label": "検索" }}
          />
          <IconButton aria-label="検索" color="primary" onClick={triggerSearch}>
            <IoSearchOutline />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
}
