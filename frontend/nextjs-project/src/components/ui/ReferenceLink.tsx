"use client";

import { useUrlTitle } from "@/hooks/useUrlTitle";
import { Box, CircularProgress, Link, Typography } from "@mui/material";
import { FaLink } from "react-icons/fa";

type ReferenceLinkProps = {
  url: string | null | undefined;
};

export default function ReferenceLink({ url }: ReferenceLinkProps) {
  const { title, isLoading } = useUrlTitle(url);

  // URLが存在しない場合は何も表示しない
  if (!url) {
    return null;
  }

  // ローディング中の表示
  if (isLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          mt: 1,
          height: "20px",
        }}
      >
        <CircularProgress size={14} sx={{ color: "kinako.900" }} />
      </Box>
    );
  }

  // 表示するテキスト（タイトルが取得できなければURL）
  const displayText = title || url;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        mt: 1,
        color: "kinako.700",
      }}
    >
      <FaLink size={12} />
      <Typography variant="caption" sx={{ color: "kinako.900" }}>
        参考URL：
      </Typography>
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", maxWidth: "calc(100% - 100px)" }}
      >
        <Typography
          variant="caption"
          component="div"
          title={displayText} // マウスオーバーで全文表示
          sx={{
            textDecoration: "underline",
            color: "kinako.900",
            "&:hover": { color: "primary.main" },
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {displayText}
        </Typography>
      </Link>
    </Box>
  );
}
