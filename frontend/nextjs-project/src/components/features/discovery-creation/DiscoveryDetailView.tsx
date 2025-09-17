"use client";

import { DISCOVERY_IMAGE_HEIGHT } from "@/constants/styles";
import { Box, Stack, CardMedia } from "@mui/material";
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
import { Post } from "@/types/post";
import { TimeOfDayIcon } from "@/utils/formatDate";
import { useImage } from "@/hooks/useImage";

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

  const { imageUrl, isLoading, isError } = useImage(post.img_id);

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
        {isLoading && (
          // ローディング中はアイコンを表示
          <CardMedia
            component="div"
            sx={{
              width: "100%",
              height: `${DISCOVERY_IMAGE_HEIGHT}px`,
              borderRadius: 2,
              backgroundColor: "yomogi.200",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              color: "yomogi.600",
            }}
          >
            <IoLeaf size={48} />
          </CardMedia>
        )}
        {isError && <div>画像の読み込みに失敗しました</div>}{" "}
        {imageUrl && <DiscoveryImage src={imageUrl} alt={post.object_label} />}
        {/* 2. 質問 */}
        <QuestionBubble text={post.user_question} />
        {/* 3. AIからの回答 (はっけん) */}
        <Section icon={<IoLeaf size={32} />} title="はっけん">
          {post.ai_answer}
        </Section>
        {/* 4. AIからの問い */}
        <Section icon={<IoSearch size={32} />} title="問い">
          {post.ai_question}
        </Section>
      </Stack>
    </Box>
  );
}
