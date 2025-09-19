"use client";

import {
  Box,
  Stack,
  CardMedia,
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import { IoLeaf, IoSearch } from "react-icons/io5";
import {
  DISCOVERY_IMAGE_HEIGHT,
  DISCOVERY_IMAGE_HEIGHT_XS,
} from "@/constants/styles";
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
import { useAuthStore } from "@/stores/authStore";
import { useDiscoveryDelete } from "@/hooks/useDiscoveryDelete";
import OverlayLoader from "../loading/OverlayLoader";
import { useEffect } from "react";
import dynamic from "next/dynamic"; // ★ dynamicインポート機能
import { useRouter, useSearchParams } from "next/navigation";
import { useMapStore } from "@/stores/mapStore";
import SubmitButton from "@/components/ui/SubmitButton";
import { MOBILE_MAX_WIDTH } from "@/constants/styles";
import { IoCloseOutline } from "react-icons/io5";
import ReferenceLink from "@/components/ui/ReferenceLink";

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
  const user = useAuthStore((state) => state.user);
  const isPostOwner = user?.uid === post.user_id;
  const {
    deleteDiscovery,
    isDeleteConfirmModalOpen,
    openDeleteConfirmModal,
    closeDeleteConfirmModal,
    isProcessingDelete,
  } = useDiscoveryDelete();
  const handleDeleteDiscovery = async () => {
    await deleteDiscovery(post.post_id);
    closeDeleteConfirmModal();
  };
  const router = useRouter();
  const setInitialTarget = useMapStore((state) => state.setInitialTarget);
  const searchParams = useSearchParams();

  const isPWA = useIsPWA();
  const discoveryHeaderHeight = isPWA
    ? DISCOVERY_HEADER_HEIGHT
    : DISCOVERY_HEADER_HEIGHT_FOR_BROWSER;

  const { imageUrl, isLoading, isError } = useImage(post.img_id);

  useEffect(() => {
    if (isError) {
      throw new Error("画像の読み込みに失敗しました");
    }
  }, [isError]);

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
    <>
      <Box sx={{ px: { xs: 2, sm: 3 }, pb: 4 }}>
        <DiscoveryHeader
          iconName={iconName}
          formattedDate={formattedDate}
          isShownDeleteButton={isPostOwner}
          isShownPrivateIcon={!post.is_public}
          onBackClick={handleBackClick}
          onDeleteClick={openDeleteConfirmModal}
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
                height: {
                  xs: `${DISCOVERY_IMAGE_HEIGHT_XS}px`,
                  sm: `${DISCOVERY_IMAGE_HEIGHT}px`,
                },
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
          {imageUrl && (
            <DiscoveryImage src={imageUrl} alt={post.object_label} />
          )}
          {/* 2. 質問 */}
          <QuestionBubble text={post.user_question} />
          {/* 3. AIからの回答 (はっけん) */}
          <Section icon={<IoLeaf size={30} />} title="はっけん">
            {post.ai_answer}
          </Section>
          {/* 3.1 参考にしたサイト */}
          <ReferenceLink url={post.ai_reference} />

          {/* 4. AIからの問い */}
          <Section icon={<IoSearch size={30} />} title="問い">
            {post.ai_question}
          </Section>
          {/* 5. はっけんした場所の地図 */}
          <Section icon={<PiMapPinFill size={30} />} title="ちず">
            <StaticPostMap post={post} />
          </Section>
        </Stack>
      </Box>
      <DeleteConfirmModal
        open={isDeleteConfirmModalOpen}
        closeModal={closeDeleteConfirmModal}
        deleteDiscovery={handleDeleteDiscovery}
      />
      {isProcessingDelete && <OverlayLoader />}
    </>
  );
}

const DeleteConfirmModal = ({
  open,
  closeModal,
  deleteDiscovery,
}: {
  open: boolean;
  closeModal: () => void;
  deleteDiscovery: () => void;
}) => {
  return (
    <Dialog
      open={open}
      disableScrollLock={true}
      onClose={closeModal}
      slotProps={{
        paper: {
          sx: {
            width: "calc(100% - 40px)",
            maxWidth: `${MOBILE_MAX_WIDTH - 40}px`,
            p: { xs: "32px 28px", sm: "40px 32px" },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: { xs: "16px", sm: "20px" },
            borderRadius: 4,
          },
        },
      }}
      keepMounted
    >
      <Box sx={{ display: "flex", flexDirection: "row-reverse" }}>
        <IoCloseOutline size={28} onClick={closeModal} cursor="pointer" />
      </Box>
      <DialogContent
        sx={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: "0",
          overflow: "visible",
          mb: "20px",
        }}
      >
        <Typography
          variant="h2"
          component="h2"
          sx={{
            textAlign: "center",
            fontSize: { xs: 20, sm: 24 },
            color: "kinako.900",
          }}
        >
          はっけんを削除しますか？
        </Typography>
        <Typography
          variant="h4"
          component="h4"
          sx={{ fontSize: { xs: 13, sm: 14 }, color: "kinako.800" }}
        >
          一度削除すると、元に戻すことはできません
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", padding: "0" }}>
        <SubmitButton onClick={deleteDiscovery} sx={{ width: "100%" }}>
          削除する
        </SubmitButton>
      </DialogActions>
    </Dialog>
  );
};
