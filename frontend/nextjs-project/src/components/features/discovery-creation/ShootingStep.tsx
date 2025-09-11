"use client";

import { Box, Fab } from "@mui/material";
import React, { useRef, useCallback } from "react";
import Webcam from "react-webcam";
import CameraFrame from "@/components/ui/CameraFrame";
import BackButton from "@/components/ui/BackButton";

interface ShootingStepProps {
  onNext: (photoDataUrl: string) => void;
  onCancel: () => void;
}

const videoConstraints = {
  facingMode: "environment",
};

export default function ShootingStep({ onNext, onCancel }: ShootingStepProps) {
  const webcamRef = useRef<Webcam>(null);

  const handleTakePhotoAndProceed = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        onNext(imageSrc);
      }
    }
  }, [webcamRef, onNext]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      <BackButton
        onClick={onCancel}
        sx={{
          position: "absolute",
          top: 16,
          left: 0,
          color: "gray.100",
          zIndex: 10,
        }}
      />

      <Box
        sx={{
          flex: 1,
          position: "relative",
          backgroundColor: "kinako.900",
          width: "100%",
        }}
      >
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
        <CameraFrame />

        <Fab
          onClick={handleTakePhotoAndProceed}
          sx={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: "translateX(-50%)",
            width: 100,
            height: 100,
            border: "4px solid white",
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.5)",
            },
          }}
        />
      </Box>
    </Box>
  );
}
