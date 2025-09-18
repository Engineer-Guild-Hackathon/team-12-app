import type { Metadata } from "next";
import { Yomogi } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import theme from "../theme";
import CssBaseline from "@mui/material/CssBaseline";
import Layout from "@/components/ui/Layout";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import AuthInitializer from "@/components/features/auth/AuthInitializer";

const yomogi = Yomogi({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-yomogi",
});

export const metadata: Metadata = {
  title:
    "holo-道端に光る「どうして？」を見つけにいこう。 AIカメラと問いで作る新しい散歩地図。",
  description:
    "散歩×地図×AIカメラで、日常の「どうして？」を見つけにいくサービスです。",
  icons: {
    icon: "/favicon_leaf.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={yomogi.variable}>
        <AppRouterCacheProvider>
          <AuthInitializer />
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Layout>{children}</Layout>
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
