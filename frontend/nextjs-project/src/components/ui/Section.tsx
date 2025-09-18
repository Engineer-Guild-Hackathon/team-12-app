import { Stack, Typography } from "@mui/material";
import React from "react";
import SectionHeader from "./SectionHeader";

interface SectionProps {
  icon: React.ReactElement;
  title: string;
  children: React.ReactNode;
}

export default function Section({ icon, title, children }: SectionProps) {
  return (
    <Stack spacing={1.5}>
      <SectionHeader icon={icon} title={title} />

      {/*
          childrenの型をチェックします。
          もし、ただの文字列や数値であれば、これまで通り<Typography>でラップします。
          もし、Reactコンポーネント（オブジェクト）であれば、そのまま描画します。
          これにより、<p><div>...</div></p> という不正なHTML構造を防ぎます。
        */}
      {typeof children === "string" || typeof children === "number" ? (
        <Typography
          variant="body1"
          sx={{ fontSize: 16, px: 1.5, whiteSpace: "pre-wrap" }}
        >
          {children}
        </Typography>
      ) : (
        // childrenがコンポーネントの場合は、ラッパーなしで直接レンダリング
        children
      )}
    </Stack>
  );
}
