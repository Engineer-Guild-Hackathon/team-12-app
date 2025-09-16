"use client";

import { useAuthStore } from "@/stores/authStore";
import { useDiscoveryCreationStore } from "@/stores/discoveryCreationStore";
import { BottomNavigationAction, Box, Stack, Typography } from "@mui/material";
import React from "react";
import { PiCamera } from "react-icons/pi";
import LoginGuideModal from "../auth/LoginGuideModal";

export default function RecordButton() {
  const startCreation = useDiscoveryCreationStore(
    (state) => state.startCreation,
  );
  const { user, isLoginGuideModalOpen, handleLoginGuideModal } = useAuthStore(
    (state) => ({
      user: state.user,
      isLoginGuideModalOpen: state.isLoginGuideModalOpen,
      handleLoginGuideModal: state.handleLoginGuideModal,
    }),
  );
  const handleStartCreation = () => {
    if (user !== null) {
      startCreation();
    } else {
      handleLoginGuideModal(true);
    }
  };
  const closeModal = () => {
    handleLoginGuideModal(false);
  };

  return (
    <>
      <BottomNavigationAction
        disableRipple
        onClick={handleStartCreation}
        icon={
          <Box
            sx={{
              position: "absolute",
              top: -28,
              padding: "3px",
              border: "2px solid",
              borderColor: "yomogi.800",
              borderRadius: "50%",
              backgroundColor: "kinako.100",
            }}
          >
            <Stack
              alignItems="center"
              justifyContent="center"
              sx={{
                backgroundColor: "yomogi.800",
                borderRadius: "50%",
                width: 84,
                height: 84,
                color: "gray.100",
              }}
            >
              <PiCamera size={36} />
              <Typography sx={{ fontSize: "0.875rem" }}>きろく</Typography>
            </Stack>
          </Box>
        }
      />
      <LoginGuideModal open={isLoginGuideModalOpen} closeModal={closeModal} />
    </>
  );
}
