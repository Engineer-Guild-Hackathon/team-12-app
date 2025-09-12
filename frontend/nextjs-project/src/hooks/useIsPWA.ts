import { useEffect, useState } from "react";

export function useIsPWA() {
  const [isPWA, setIsPWA] = useState(false);
  useEffect(() => {
    setIsPWA(window.matchMedia("(display-mode: standalone)").matches);
  }, []);
  return isPWA;
}
