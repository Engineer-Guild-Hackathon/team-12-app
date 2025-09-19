"use client";

import { useUrlTitle } from "@/hooks/useUrlTitle";
import {
  Box,
  CircularProgress,
  Link,
  SxProps,
  Theme,
  Typography,
} from "@mui/material";
import { FaLink } from "react-icons/fa";

type ReferenceLinkProps = {
  url: string | null | undefined;
  sx?: SxProps<Theme>;
};

export default function ReferenceLink({ url, sx }: ReferenceLinkProps) {
  const { title, isLoading } = useUrlTitle(url);

  if (!url) {
    return null;
  }

  const displayText = title || url;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        mt: 1,
        ml: 2,
        color: "kinako.700",
        ...sx,
      }}
    >
      {isLoading ? (
        <CircularProgress size={14} sx={{ color: "kinako.900", mt: 1 }} />
      ) : (
        <>
          <FaLink size={12} />
          <Typography
            variant="caption"
            sx={{ color: "kinako.900", whiteSpace: "nowrap" }}
          >
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
              title={displayText}
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
        </>
      )}
    </Box>
  );
}
