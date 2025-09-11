import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import Link from "next/link";
import { mockPosts } from "@/data/mockPosts";
import React from "react";

export default function ListPage() {
  return (
    <Box sx={{ p: 2, overflowY: "scroll", height: "100%" }}>
      <Typography
        variant="h5"
        component="h1"
        sx={{ mb: 2, fontWeight: "bold" }}
      >
        はっけん一覧
      </Typography>
      <List>
        {mockPosts.map((post, index) => (
          // Reactのmapでリストをレンダリングする際は、ユニークなkeyを渡します
          <React.Fragment key={post.post_id}>
            <ListItem disablePadding>
              {/* ListItemButtonをNext.jsのLinkとして機能させる */}
              <ListItemButton
                component={Link}
                href={`/discoveries/${post.post_id}`} // post_idをslugとしてURLを生成
              >
                <ListItemText
                  primary={post.question} // 質問文をメインのテキストとして表示
                  primaryTypographyProps={{
                    fontWeight: "medium",
                    color: "text.primary",
                  }}
                  secondaryTypographyProps={{
                    color: "text.secondary",
                  }}
                />
              </ListItemButton>
            </ListItem>
            {/* 最後の要素以外に区切り線を入れる */}
            {index < mockPosts.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
}
