"use client";

import { BottomNavigationAction, Box, Stack, Typography } from "@mui/material";
import React from "react";
import { PiCamera } from "react-icons/pi";

export default function RecordButton() {
  const handleRecordClick = () => {
    alert("「きろく」タスクを開始します！");
  };

  return (
    <BottomNavigationAction
      disableRipple
      onClick={handleRecordClick}
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
  );
}
