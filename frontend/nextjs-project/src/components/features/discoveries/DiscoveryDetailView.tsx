"use client";

import { DISCOVERY_IMAGE_HEIGHT } from "@/constants/styles";
import { Box, Stack, CardMedia } from "@mui/material";
import { IoLeaf, IoSearch } from "react-icons/io5";
import { PiMapPinFill } from "react-icons/pi"; // ★ 地図セクション用のアイコンをインポート
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
import dynamic from "next/dynamic"; // ★ dynamicインポート機能
import { useRouter, useSearchParams } from "next/navigation";
import { useMapStore } from "@/stores/mapStore";

// ★ 地図コンポーネントを、サーバーサイドレンダリングを無効にして動的にインポート
const StaticPostMap = dynamic(
  () => import("@/components/features/discoveries/StaticPostMap"),
  { ssr: false },
);

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
  const router = useRouter();
  const setInitialTarget = useMapStore((state) => state.setInitialTarget);
  const searchParams = useSearchParams();

  const isPWA = useIsPWA();
  const discoveryHeaderHeight = isPWA
    ? DISCOVERY_HEADER_HEIGHT
    : DISCOVERY_HEADER_HEIGHT_FOR_BROWSER;

  const { imageUrl, isLoading, isError } = useImage(post.img_id);

  const handleBackClick = () => {
    // ★ URLに ?from=map が含まれているかチェック
    const fromMap = searchParams.get("from") === "map";

    if (fromMap) {
      // マップページから来た場合：Zustandに情報をセットしてマップページに戻る
      setInitialTarget({
        postId: post.post_id,
        lat: post.latitude,
        lng: post.longitude,
        useSavedZoom: true,
      });
      router.push("/");
    } else {
      // それ以外のページから来た場合：通常のブラウザバックを実行
      router.back();
    }
  };

  return (
    <Box sx={{ px: 3, pb: 4 }}>
      <DiscoveryHeader
        iconName={iconName}
        formattedDate={formattedDate}
        onBackClick={handleBackClick}
      />
      <Stack
        spacing={4}
        sx={{
          color: "kinako.900",
          pt: `${discoveryHeaderHeight + 20}px`,
          pb: "20px",
        }}
      >
        {isLoading && (
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
        {isError && <div>画像の読み込みに失敗しました</div>}
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
        {/* 5. はっけんした場所の地図 */}
        <Section icon={<PiMapPinFill size={32} />} title="ちず">
          <StaticPostMap post={post} />
        </Section>
      </Stack>
    </Box>
  );
}
