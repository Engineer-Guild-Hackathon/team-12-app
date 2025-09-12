import { Box, IconButton, SvgIcon, Toolbar, Typography } from "@mui/material";
import Link from "next/link";
import { IoLeaf, IoFilterOutline } from "react-icons/io5";

type HeaderTopProps = {
  onFilterClick?: () => void;
};

export default function HeaderTop({ onFilterClick }: HeaderTopProps) {
  return (
    <Toolbar disableGutters sx={{ px: 1 }}>
      {/* 左側の見えないスペーサー */}
      <Box sx={{ width: 40 }} />

      {/* 中央のロゴとタイトル */}
      <Box
        component={Link}
        href="/"
        sx={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textDecoration: "none",
          color: "inherit",
        }}
      >
        <SvgIcon sx={{ mr: 1.5 }}>
          <IoLeaf />
        </SvgIcon>
        <Typography variant="h6" component="div">
          はっけん
        </Typography>
      </Box>

      {/* 右側のフィルターアイコン */}
      {onFilterClick && (
        <IconButton color="inherit" onClick={onFilterClick} sx={{ width: 40 }}>
          <SvgIcon>
            <IoFilterOutline />
          </SvgIcon>
        </IconButton>
      )}
    </Toolbar>
  );
}
