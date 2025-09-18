import {
  DISCOVERY_IMAGE_HEIGHT,
  DISCOVERY_IMAGE_HEIGHT_XS,
} from "@/constants/styles";
import { Box } from "@mui/material";
import Image, { StaticImageData } from "next/image";

interface DiscoveryImageProps {
  src: string | StaticImageData;
  alt: string;
}

export default function DiscoveryImage({ src, alt }: DiscoveryImageProps) {
  return (
    <Box
      sx={{
        width: "100%",
        height: {
          xs: `${DISCOVERY_IMAGE_HEIGHT_XS}px`,
          sm: `${DISCOVERY_IMAGE_HEIGHT}px`,
        },
        position: "relative",
        overflow: "hidden",
        borderRadius: 4,
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        style={{
          objectFit: "cover",
        }}
        sizes="(max-width: 500px) 100svw"
      />
    </Box>
  );
}
