"use client";

import { Post } from "@/types/post";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Typography,
} from "@mui/material";
import Link from "next/link";
import React, { useMemo } from "react";
import { formatTimestampForClient } from "@/utils/formatDate";
import { calculateDistance } from "@/utils/calculateDistance";
import TimestampDisplay from "./TimestampDisplay";
import getIconComponent from "@/utils/getIconComponent";

interface DiscoveryCardProps {
  post: Post;
  currentLocation: { latitude: number | null; longitude: number | null };
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
}: DiscoveryCardProps) {
  // 投稿時間とアイコンを取得
  const { iconName, formattedDate } = formatTimestampForClient(
    new Date(post.date),
  );
  const iconComponent = getIconComponent(iconName);

  // 距離を計算（useMemoで不要な再計算を防ぐ）
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
        href={`/discoveries/${post.post_id}`}
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "row",
          gap: 2,
          alignItems: "flex-start",
          p: 2.5,
          width: "100%",
          height: "100%",
        }}
      >
        <CardMedia
          component="img"
          image={`https://placehold.co/600x400/EFEFEF/333?text=Image+ID:${post.img_id}`}
          alt={post.target}
          sx={{
            objectFit: "cover",
            width: "100px",
            height: "100px",
            borderRadius: 2,
          }}
        />
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
              sx={{ fontSize: 14, color: "kinako.800" }}
            >
              {formatDistance(distance)}
            </Typography>
          </Box>

          <Typography
            variant="h6"
            component="div"
            sx={{
              fontSize: 14,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
              width: "100%",
            }}
          >
            {post.question}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
