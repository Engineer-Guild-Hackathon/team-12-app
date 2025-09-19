"use client";

import { useState, KeyboardEvent, ChangeEvent } from "react";
import { Box, TextField, IconButton } from "@mui/material";
import { IoSearchOutline } from "react-icons/io5";

interface SearchBarProps {
  onSearch: (q: string) => void;
  initialQuery?: string;
  onQueryChange?: (q: string) => void; // 入力中のクエリ（空文字は自動リセット用）
}

/**
 * 地図の上に重ねて固定表示する検索バー
 * スタイルは最小限。UIのルールに合わせてMUIコンポーネントを使用。
 */
export function SearchBarOnMap({
  onSearch,
  initialQuery,
  onQueryChange,
}: SearchBarProps) {
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
        border: "1px solid",
        borderColor: "kinako.300",
      }}
    >
      <SearchBarOnListPage
        initialQuery={initialQuery}
        onSearch={onSearch}
        onQueryChange={onQueryChange}
      />
    </Box>
  );
}

export const SearchBarOnListPage = ({
  initialQuery,
  onSearch,
  onQueryChange,
}: {
  initialQuery?: string;
  onSearch: (q: string) => void;
  onQueryChange?: (q: string) => void;
}) => {
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
  const handleChange = (value: string) => {
    setQuery(value);
    // 入力が空になったら、親に空文字を通知（自動リセット用）
    if (onQueryChange) {
      onQueryChange(value);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 560,
        height: "40px",
        backgroundColor: "white",
        borderRadius: "8px",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
      }}
    >
      <IconButton aria-label="検索" onClick={triggerSearch}>
        <IoSearchOutline size={24} color="#8B7355" />
      </IconButton>
      <TextField
        id="search-bar"
        fullWidth
        size="small"
        placeholder="検索ワードを入力"
        value={query}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          handleChange(e.target.value)
        }
        onKeyDown={handleKeyDown}
        inputProps={{ "aria-label": "検索" }}
        sx={{
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              border: "none",
            },
            "& input": {
              padding: "12px 8px 12px 4px",
            },
          },
        }}
      />
    </Box>
  );
};
