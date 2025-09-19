"use client";

import {
  Box,
  Stack,
  CardMedia,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import { IoLeaf, IoSearch, IoClose } from "react-icons/io5";
import Link from "next/link";
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
    isDeleteModalOpen,
    openDeleteModal,
    closeDeleteModal,
    isDeleteCompleteModalOpen,
    closeDeleteCompleteModal,
    isProcessingDelete,
  } = useDiscoveryDelete();
  const handleDeleteDiscovery = () => {
    deleteDiscovery(post.post_id);
    closeDeleteModal();
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
          {post.ai_reference && (
            <Box sx={{ mt: 1 }}>
              <Link
                href={post.ai_reference}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <Typography
                  variant="body2"
                  component="div"
                  sx={{
                    display: "block",
                    textDecoration: "underline",
                    color: "kinako.900",
                    "&:hover": {
                      color: "primary.main",
                    },
                    transition: "color 0.2s ease-in-out",
                  }}
                >
                  AIが参考にしたサイト
                </Typography>
              </Link>
            </Box>
          )}
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
        open={isDeleteModalOpen}
        closeModal={closeDeleteModal}
        deleteDiscovery={handleDeleteDiscovery}
      />
      <DeleteCompleteModal
        open={isDeleteCompleteModalOpen}
        closeModal={closeDeleteCompleteModal}
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
      slotProps={{
        paper: {
          sx: {
            width: "400px",
            p: "40px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "20px",
            borderRadius: "16px",
          },
        },
      }}
      keepMounted
    >
      <Box
        sx={{ display: "flex", flexDirection: "row-reverse", height: "12px" }}
      >
        <IoClose size={20} onClick={closeModal} cursor="pointer" />
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
          sx={{ textAlign: "center", fontSize: 24, color: "kinako.900" }}
        >
          はっけんを削除しますか？
        </Typography>
        <Typography
          variant="h4"
          component="h4"
          sx={{ fontSize: 14, color: "kinako.800" }}
        >
          一度削除すると、元に戻すことはできません
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", padding: "0" }}>
        <Button
          variant="contained"
          onClick={deleteDiscovery}
          autoFocus
          sx={{
            backgroundColor: "kinako.900",
            color: "white",
            "&:hover": {
              backgroundColor: "kinako.700",
            },
            padding: "8px 16px",
            height: "56px",
            width: "100%",
            borderRadius: "200px",
            textTransform: "none",
            fontSize: "20px",
            alignSelf: "center",
          }}
        >
          削除する
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const DeleteCompleteModal = ({
  open,
  closeModal,
}: {
  open: boolean;
  closeModal: () => void;
}) => {
  return (
    <Dialog
      open={open}
      slotProps={{
        paper: {
          sx: {
            width: "400px",
            p: "40px 32px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "20px",
            borderRadius: "16px",
          },
        },
      }}
    >
      <Box
        sx={{ display: "flex", flexDirection: "row-reverse", height: "12px" }}
      >
        <IoClose size={20} onClick={closeModal} cursor="pointer" />
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
          sx={{ textAlign: "center", fontSize: 24, color: "kinako.900" }}
        >
          はっけんを削除しました
        </Typography>
      </DialogContent>
    </Dialog>
  );
};
