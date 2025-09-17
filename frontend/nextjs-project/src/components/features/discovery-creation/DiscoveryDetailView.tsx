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
import { DISCOVERY_IMAGE_HEIGHT } from "@/constants/styles";
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
  } = useDiscoveryDelete();
  const handleDeleteDiscovery = () => {
    deleteDiscovery(post.post_id);
    closeDeleteModal();
  };
  const isPWA = useIsPWA();
  const discoveryHeaderHeight = isPWA
    ? DISCOVERY_HEADER_HEIGHT
    : DISCOVERY_HEADER_HEIGHT_FOR_BROWSER;

  const { imageUrl, isLoading, isError } = useImage(post.img_id);

  return (
    <>
      <Box sx={{ px: 3 }}>
        <DiscoveryHeader
          iconName={iconName}
          formattedDate={formattedDate}
          isShownDeleteButton={isPostOwner}
          onDeleteClick={openDeleteModal}
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
          {isLoading && <div>画像を読み込んでいます...</div>}
          {isError && <div>画像の読み込みに失敗しました</div>}{" "}
          {imageUrl && (
            <DiscoveryImage src={imageUrl} alt={post.object_label} />
          )}
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
      <DeleteConfirmModal
        open={isDeleteModalOpen}
        closeModal={closeDeleteModal}
        deleteDiscovery={handleDeleteDiscovery}
      />
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
