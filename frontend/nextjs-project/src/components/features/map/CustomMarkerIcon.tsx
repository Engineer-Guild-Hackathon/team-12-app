import React from "react";
import marker from "../../../../public/marker.svg";
import Image from "next/image";

export default function CustomMarkerIcon() {
  return <Image src={marker} alt="マーカー" width={40} height={40} />;
}
