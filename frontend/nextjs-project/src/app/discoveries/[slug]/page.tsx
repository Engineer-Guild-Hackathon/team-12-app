import { Box, Stack } from "@mui/material";
import { mockPosts } from "@/data/mockPosts";
import { notFound } from "next/navigation";
import { IoLeaf, IoSearch } from "react-icons/io5";
import dummyImage from "../../../../public/dummy_kinoko.jpg";
import QuestionBubble from "@/components/ui/QuestioinBubble";
import Section from "@/components/ui/Section";
import DiscoveryImage from "@/components/ui/DiscoveryImage";
import DiscoveryHeader from "@/components/ui/DiscoveryHeader";
import { DISCOVERY_HEADER_HEIGHT } from "@/constants/styles";
import { formatTimestampForServer } from "@/utils/formatDate";

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
    <Box sx={{ px: 3 }}>
      <DiscoveryHeader iconName={iconName} formattedDate={formattedDate} />
      <Stack
        spacing={4}
        sx={{
          color: "kinako.900",
          pt: `${DISCOVERY_HEADER_HEIGHT + 20}px`,
          pb: "20px",
        }}
      >
        {/* 1. 画像 */}
        <DiscoveryImage src={dummyImage} alt={post.target} />

        {/* 2. 質問 */}
        <QuestionBubble text={post.question} />

        {/* 3. AIからの回答 (はっけん) */}
        <Section icon={<IoLeaf size={32} />} title="はっけん">
          {post.answer}
        </Section>

        {/* 4. アプリからの問い */}
        <Section icon={<IoSearch size={32} />} title="問い">
          {post.toi}
        </Section>
      </Stack>
    </Box>
  );
}
