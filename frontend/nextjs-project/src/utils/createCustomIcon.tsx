import CustomMarkerIcon from "@/components/features/map/CustomMarkerIcon";
import L from "leaflet";
import ReactDOMServer from "react-dom/server";

export const createCustomIcon = () => {
  return L.divIcon({
    html: ReactDOMServer.renderToString(<CustomMarkerIcon />),
    className: "custom-marker-icon",
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};
