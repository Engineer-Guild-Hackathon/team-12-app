import {
  DISCOVERY_IMAGE_HEIGHT,
  DISCOVERY_IMAGE_HEIGHT_XS,
} from "@/constants/styles";
import { Box } from "@mui/material";

export default function CameraFrame() {
  const cornerStyles = {
    position: "absolute",
    width: "48px",
    height: "40px",
    borderStyle: "solid",
    borderColor: "rgba(255, 255, 255, 0.8)",
  };

  return (
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        transform: "translateY(-50%)",
        left: 0,
        width: "100%",
        height: {
          xs: `${DISCOVERY_IMAGE_HEIGHT_XS}px`,
          sm: `${DISCOVERY_IMAGE_HEIGHT}px`,
        },
        pointerEvents: "none",
        borderRadius: "16px",
      }}
    >
      <Box
        sx={{
          ...cornerStyles,
          top: 16,
          left: 16,
          borderWidth: "4px 0 0 4px",
          borderRadius: "16px 0 0 0",
        }}
      />
      <Box
        sx={{
          ...cornerStyles,
          top: 16,
          right: 16,
          borderWidth: "4px 4px 0 0",
          borderRadius: "0 16px 0 0",
        }}
      />
      <Box
        sx={{
          ...cornerStyles,
          bottom: 16,
          left: 16,
          borderWidth: "0 0 4px 4px",
          borderRadius: "0 0 0 16px",
        }}
      />
      <Box
        sx={{
          ...cornerStyles,
          bottom: 16,
          right: 16,
          borderWidth: "0 4px 4px 0",
          borderRadius: "0 0 16px 0",
        }}
      />
    </Box>
  );
}
