"use client";

import { Post } from "@/types/post";
import {
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
  Box,
} from "@mui/material";
import Link from "next/link";
import React, { useMemo, useRef } from "react";
import { formatTimestampForClient } from "@/utils/formatDate";
import { calculateDistance } from "@/utils/calculateDistance";
import TimestampDisplay from "./TimestampDisplay";
import getIconComponent from "@/utils/getIconComponent";
import { useImage } from "@/hooks/useImage";
import { useOnScreen } from "@/hooks/useOnScreen";
import { IoLeaf } from "react-icons/io5";

interface DiscoveryCardProps {
  post: Post;
  currentLocation: { latitude: number | null; longitude: number | null };
  from?: string;
}

// 距離を分かりやすい文字列にフォーマットする関数
const formatDistance = (meters: number | null) => {
  if (meters === null) return "計測中...";
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

export default function DiscoveryCard({
  post,
  currentLocation,
  from,
}: DiscoveryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isOnScreen = useOnScreen(cardRef); // カードが画面上にあるか監視

  const detailPageHref = from
    ? `/discoveries/${post.post_id}?from=${from}`
    : `/discoveries/${post.post_id}`;

  // 投稿時間とアイコンを取得
  const { iconName, formattedDate } = formatTimestampForClient(
    new Date(post.date),
  );
  const iconComponent = getIconComponent(iconName);

  // カードが画面に表示されてから、初めて画像取得のフックを有効化する
  const { imageUrl } = useImage(isOnScreen ? post.img_id : null);
  // const { imageUrl } = useImage(null);

  const distance = useMemo(() => {
    if (currentLocation.latitude && currentLocation.longitude) {
      return calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        post.latitude,
        post.longitude,
      );
    }
    return null;
  }, [currentLocation, post.latitude, post.longitude]);

  return (
    <Card
      ref={cardRef}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        color: "kinako.900",
        gap: 2,
        borderRadius: 3,
        boxShadow: "0 0 40px rgba(0, 0, 0, 0.01)",
      }}
    >
      <CardActionArea
        component={Link}
        href={detailPageHref}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "row",
          gap: { xs: 1.5, sm: 2 },
          alignItems: "flex-start",
          p: { xs: 2.1, sm: 2.5 },
          width: "100%",
          height: "100%",
        }}
      >
        {imageUrl ? (
          // imageUrlが存在する場合は、今まで通り画像を表示
          <CardMedia
            component="img"
            image={imageUrl}
            alt={post.object_label}
            sx={{
              objectFit: "cover",
              width: { xs: "90px", sm: "100px" },
              height: { xs: "90px", sm: "100px" },
              minWidth: { xs: "90px", sm: "100px" },
              minHeight: { xs: "90px", sm: "100px" },
              borderRadius: 2,
            }}
          />
        ) : (
          // imageUrlがない場合は、アイコンを表示する
          <CardMedia
            // componentを"div"に変更
            component="div"
            sx={{
              width: "100px",
              height: "100px",
              minWidth: "100px",
              minHeight: "100px",
              borderRadius: 2,
              color: "yomogi.600", // アイコンの色を設定
              backgroundColor: "yomogi.200", // テーマの色に合わせて調整
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <IoLeaf size={32} />
          </CardMedia>
        )}
        <CardContent
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            p: 0,
            gap: 1,
            minWidth: 0,
            height: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
            }}
          >
            <TimestampDisplay
              icon={iconComponent}
              formattedDate={formattedDate}
              variant="small"
            />
            <Typography
              variant="h6"
              component="div"
              sx={{ fontSize: { xs: 12, sm: 14 }, color: "kinako.800" }}
            >
              {formatDistance(distance)}
            </Typography>
          </Box>

          <Typography
            variant="h6"
            component="div"
            sx={{
              fontSize: { xs: 12, sm: 14 },
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              width: "100%",
            }}
          >
            {post.user_question}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
