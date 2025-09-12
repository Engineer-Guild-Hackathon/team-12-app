"use client";

import { Box, Stack } from "@mui/material";
import { IoLeaf, IoSearch } from "react-icons/io5";
import QuestionBubble from "@/components/ui/QuestioinBubble";
import Section from "@/components/ui/Section";
import DiscoveryImage from "@/components/ui/DiscoveryImage";
import DiscoveryHeader from "@/components/ui/DiscoveryHeader";
import {
  DISCOVERY_HEADER_HEIGHT,
  DISCOVERY_HEADER_HEIGHT_FOR_BROWSER,
} from "@/constants/styles";
import { useIsPWA } from "@/hooks/useIsPWA";
import { Post } from "@/types/post"; // Post型をインポート
import { TimeOfDayIcon } from "@/utils/formatDate";
import { useEffect, useState } from "react";
import { fetchImage } from "@/libs/fetchImage";

// コンポーネントが受け取るプロパティの型を定義
interface DiscoveryDetailViewProps {
  post: Post;
  iconName: TimeOfDayIcon;
  formattedDate: string;
}

export default function DiscoveryDetailView({
  post,
  iconName,
  formattedDate,
}: DiscoveryDetailViewProps) {
  const isPWA = useIsPWA();
  const discoveryHeaderHeight = isPWA
    ? DISCOVERY_HEADER_HEIGHT
    : DISCOVERY_HEADER_HEIGHT_FOR_BROWSER;
  const [imageUrl, setImageUrl] = useState<string>(
    `https://placehold.co/600x400/EFEFEF/333?text=Image+ID:${post.img_id}`
  );

  useEffect(() => {
    if (!post.img_id) {
      setImageUrl("");
      return;
    }

    const controller = new AbortController();

    fetchImage(post.img_id, { signal: controller.signal })
      .then((res) => {
        setImageUrl(res.signed_url);
      })
      .catch((err) => {
        // Abort は無視
        if (err?.name !== "AbortError") {
          console.error("Error fetching image:", err);
        }
      });

    return () => {
      controller.abort();
    };
  }, [post.img_id]);

  return (
    <Box sx={{ px: 3 }}>
      <DiscoveryHeader iconName={iconName} formattedDate={formattedDate} />
      <Stack
        spacing={4}
        sx={{
          color: "kinako.900",
          pt: `${discoveryHeaderHeight + 20}px`,
          pb: "20px",
        }}
      >
        {/* 1. 画像 */}
        {/* TODO: useEffectの反映に時間がかかるのでローディング作る */}
        {/* できればサーバーサイドで読み込みたい */}
        {imageUrl && <DiscoveryImage src={imageUrl} alt={post.target} />}

        {/* 2. 質問 */}
        <QuestionBubble text={post.question} />

        {/* 3. AIからの回答 (はっけん) */}
        <Section icon={<IoLeaf size={32} />} title="はっけん">
          {post.answer}
        </Section>

        {/* 4. アプリからの問い */}
        <Section icon={<IoSearch size={32} />} title="問い">
          {post.toi}
        </Section>
      </Stack>
    </Box>
  );
}
