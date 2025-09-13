import DiscoveryDetailClient from "./client";

export default async function DiscoveryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // ここで unwrap（または React.use(params) でもOK）
  const { slug } = await params;
  return <DiscoveryDetailClient slug={slug} />;
}
