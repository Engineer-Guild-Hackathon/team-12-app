import React from "react";
import marker from "../../../../public/marker.svg";
import selectedMarker from "../../../../public/selected-marker.svg";
import Image from "next/image";

interface CustomMarkerIconProps {
  isSelected?: boolean;
}

export default function CustomMarkerIcon({
  isSelected,
}: CustomMarkerIconProps) {
  const iconSrc = isSelected ? selectedMarker : marker;
  return <Image src={iconSrc} alt="マーカー" width={40} height={40} />;
}
