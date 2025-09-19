export const isMobile = () =>
  typeof window !== "undefined" &&
  /iPhone|Android.+Mobile|Windows Phone/.test(window.navigator.userAgent);
