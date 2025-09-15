"use client";

import { useState, useEffect, RefObject } from "react";

export function useOnScreen(ref: RefObject<HTMLElement | null>): boolean {
  const [isOnScreen, setIsOnScreen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsOnScreen(true);
          observer.unobserve(entry.target); // 一度表示されたら監視を停止
        }
      },
      { rootMargin: "100px" }, // 画面の下100pxの位置に入ったら発火
    );

    const currentRef = ref.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [ref]);

  return isOnScreen;
}
