import { mockPosts } from "@/data/mockPosts";
import { notFound } from "next/navigation";
import { formatTimestampForServer } from "@/utils/formatDate";
import DiscoveryDetailView from "@/components/features/discovery-creation/DiscoveryDetailView";

export default async function DiscoveryDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = mockPosts.find((p) => p.post_id === params.slug);

  if (!post) {
    notFound();
  }

  const { iconName, formattedDate } = formatTimestampForServer(post.date);

  return (
    <DiscoveryDetailView
      post={post}
      iconName={iconName}
      formattedDate={formattedDate}
    />
  );
}
