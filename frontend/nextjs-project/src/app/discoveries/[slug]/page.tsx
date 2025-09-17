import { Box } from "@mui/material";
import DiscoveryDetailClient from "./client";

export default async function DiscoveryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // ここで unwrap（または React.use(params) でもOK）
  const { slug } = await params;
  return (
    <Box sx={{ height: "100%", width: "100%" }}>
      <DiscoveryDetailClient slug={slug} />
    </Box>
  );
}
