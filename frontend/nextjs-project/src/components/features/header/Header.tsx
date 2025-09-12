import { AppBar } from "@mui/material";
import {
  MOBILE_MAX_WIDTH,
  HEADER_HEIGHT,
  HEADER_HEIGHT_FOR_BROWSER,
} from "@/constants/styles";
import HeaderTop from "./HeaderTop";
import HeaderTabs from "./HeaderTabs";
import { useIsPWA } from "@/hooks/useIsPWA";

export default function Header() {
  const isPWA = useIsPWA();
  const headerHeight = isPWA ? HEADER_HEIGHT : HEADER_HEIGHT_FOR_BROWSER;
  const gapStyle = isPWA ? "12px" : "0px";

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: "100%",
        maxWidth: `${MOBILE_MAX_WIDTH}px`,
        height: `${headerHeight}px`,
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "kinako.100",
        color: "kinako.900",
        borderBottom: "1px solid",
        borderColor: "kinako.300",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        gap: { gapStyle },
      }}
    >
      <HeaderTop />
      <HeaderTabs />
    </AppBar>
  );
}
