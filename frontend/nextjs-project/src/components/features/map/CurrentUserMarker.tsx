"use client";

import React, { useMemo } from "react";
import { Marker } from "react-leaflet";
import { divIcon } from "leaflet";
import { renderToStaticMarkup } from "react-dom/server";

interface CurrentUserMarkerProps {
  position: [number, number];
}

const CurrentUserMarker: React.FC<CurrentUserMarkerProps> = ({ position }) => {
  const icon = useMemo(() => {
    const iconComponent = (
      <>
        <style>
          {`
            .current-user-marker-icon {
              /* Leafletがデフォルトで適用する背景や枠線をリセット */
              background: none;
              border: none;
            }
            .user-marker-pulse {
              animation: pulse-animation 1.5s infinite cubic-bezier(0.45, 0, 0.2, 1);
            }
            @keyframes pulse-animation {
              0% {
                transform: scale(0.1);
                opacity: 1;
              }
              70% {
                transform: scale(1);
                opacity: 0.3;
              }
              100% {
                opacity: 0;
              }
            }
          `}
        </style>

        <div
          style={{
            position: "relative",
            width: "32px",
            height: "32px",
            pointerEvents: "none",
          }}
        >
          {/* 外側の脈打つ円 */}
          <div
            className="user-marker-pulse"
            style={{
              position: "absolute",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#322508",
            }}
          />
          {/* 内側の中心点 */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              backgroundColor: "#322508",
              border: "2px solid white",
              boxShadow: "0 0 5px rgba(0,0,0,0.3)",
            }}
          />
        </div>
      </>
    );

    const iconMarkup = renderToStaticMarkup(iconComponent);

    return divIcon({
      html: iconMarkup,
      className: "current-user-marker-icon",
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, []);

  return <Marker position={position} icon={icon} zIndexOffset={1000} />;
};

export default React.memo(CurrentUserMarker);
