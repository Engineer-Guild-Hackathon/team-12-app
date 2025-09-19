"use client";

import { useAuthStore } from "@/stores/authStore";
import { useDiscoveryCreationStore } from "@/stores/discoveryCreationStore";
import { BottomNavigationAction, Box, Stack, Typography } from "@mui/material";
import React from "react";
import { PiCamera } from "react-icons/pi";

export default function RecordButton() {
  const startCreation = useDiscoveryCreationStore(
    (state) => state.startCreation,
  );
  const user = useAuthStore((s) => s.user);
  const handleLoginGuideModal = useAuthStore((s) => s.handleLoginGuideModal);
  const handleStartCreation = () => {
    if (user !== null) {
      startCreation();
    } else {
      handleLoginGuideModal(true);
    }
  };

  return (
    <BottomNavigationAction
      disableRipple
      onClick={handleStartCreation}
      icon={
        <Box
          sx={{
            position: "absolute",
            top: { xs: -20, sm: -28 },
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
              width: { xs: 76, sm: 84 },
              height: { xs: 76, sm: 84 },
              color: "gray.100",
            }}
          >
            <PiCamera size={36} />
            <Typography sx={{ fontSize: { xs: 12, sm: 14 } }}>
              きろく
            </Typography>
          </Stack>
        </Box>
      }
    />
  );
}
