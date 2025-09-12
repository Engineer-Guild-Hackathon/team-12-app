"use client";

import DiscoveryCard from "@/components/ui/DiscoveryCard";
import { BOTTOM_NAV_HEIGHT, MOBILE_MAX_WIDTH } from "@/constants/styles";
import { Post } from "@/types/post";
import { Modal, Box } from "@mui/material";
import React from "react";

interface DiscoveryCardModalProps {
  post: Post | null;
  currentLocation: { latitude: number | null; longitude: number | null };
  onClose: () => void;
}

export default function DiscoveryCardModal({
  post,
  currentLocation,
  onClose,
}: DiscoveryCardModalProps) {
  if (!post) {
    return null;
  }

  return (
    <Modal
      open={!!post}
      onClose={onClose}
      closeAfterTransition
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: "transparent",
          },
        },
      }}
      sx={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          pb: `${BOTTOM_NAV_HEIGHT + 40}px`,
          width: `${MOBILE_MAX_WIDTH - 40}px`,
        }}
      >
        <DiscoveryCard post={post} currentLocation={currentLocation} />
      </Box>
    </Modal>
  );
}
