import CustomMarkerIcon from "@/components/features/map/CustomMarkerIcon";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";

export const createCustomIcon = (isSelected: boolean = false) => {
  return L.divIcon({
    html: ReactDOMServer.renderToString(
      <CustomMarkerIcon isSelected={isSelected} />,
    ),
    className: "custom-marker-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};
