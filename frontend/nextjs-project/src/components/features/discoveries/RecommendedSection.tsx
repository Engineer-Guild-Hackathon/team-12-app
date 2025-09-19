"use client";

import React, { Suspense, useMemo } from "react";
import { Stack, CardMedia, useTheme } from "@mui/material";
import DiscoveryCard from "@/components/ui/DiscoveryCard";
import { useGeolocation } from "@/hooks/useGeolocation";
import { Post } from "@/types/post";
// 検索は usePosts の query を用いる
import { IoLeaf } from "react-icons/io5";
import { usePosts } from "@/hooks/usePosts";
import Section from "@/components/ui/Section";
import Image from "next/image";
import sprout from "../../../../public/sprout.svg";

type RecommendedSectionProps = {
  post: Post;
};

const RecommendPlaceHolder = () => {
  const theme = useTheme();

  return (
    <Stack spacing={1.5}>
      {Array.from({ length: 2 }, (_, index) => (
        <CardMedia
          key={index}
          component="div"
          sx={{
            width: "100%",
            height: "140px",
            borderRadius: 3,
            // 白
            backgroundColor: "gray.100",
            display: "flex",
            gap: 2,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {Array.from({ length: 3 }, (_, index) => (
            <IoLeaf key={index} size={24} color={theme.palette.yomogi["400"]} />
          ))}
        </CardMedia>
      ))}
    </Stack>
  );
};

function RecommendedContent({ post }: RecommendedSectionProps) {
  const { latitude, longitude } = useGeolocation();
  const theme = useTheme();
  const query = useMemo(() => {
    const label = (post.object_label ?? "").trim();
    const date = (post.date ?? "").toString().trim();
    return [label, date].filter(Boolean).join(" ");
  }, [post.object_label, post.date]);

  const { posts: searchedPosts } = usePosts({ query });

  // usePosts を検索なし（query未指定）で呼び、存在検証用の一覧を取得
  const { posts: allPosts } = usePosts({});

  const validatedRecommendations = useMemo(() => {
    const items = searchedPosts ?? [];
    const validIdSet = new Set((allPosts ?? []).map((p) => p.post_id));
    const isNotShownPost = (p: Post) => p.post_id !== post.post_id;
    return items
      .filter((p) => isNotShownPost(p) && validIdSet.has(p.post_id))
      .slice(0, 2);
  }, [searchedPosts, allPosts, post.post_id]);

  // 正しく取得・フィルタリングして0件の時はセクションごと非表示
  const shouldHideSection =
    (searchedPosts && searchedPosts.length === 0) ||
    (searchedPosts &&
      searchedPosts.length > 0 &&
      (validatedRecommendations?.length ?? 0) === 0);

  if (shouldHideSection) return null;

  const placeholdersCount = Math.max(
    0,
    2 - (validatedRecommendations?.length ?? 0),
  );

  return (
    <Section
      icon={<Image src={sprout} alt="" width={30} height={30} />}
      title="おすすめ"
    >
      <Stack spacing={1.5}>
        {(validatedRecommendations ?? []).map((p) => (
          <DiscoveryCard
            key={p.post_id}
            post={p}
            currentLocation={{ latitude, longitude }}
            from="detail"
          />
        ))}
        {Array.from({ length: placeholdersCount }, (_, index) => (
          <CardMedia
            key={`ph-${index}`}
            component="div"
            sx={{
              width: "100%",
              height: "140px",
              borderRadius: 3,
              backgroundColor: "gray.100",
              display: "flex",
              gap: 2,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {Array.from({ length: 3 }, (__, i) => (
              <IoLeaf key={i} size={24} color={theme.palette.yomogi["400"]} />
            ))}
          </CardMedia>
        ))}
      </Stack>
    </Section>
  );
}

export default function RecommendedSection({ post }: RecommendedSectionProps) {
  return (
    <Suspense
      fallback={
        <Section
          icon={<Image src={sprout} alt="" width={30} height={30} />}
          title="おすすめ"
        >
          <RecommendPlaceHolder />
        </Section>
      }
    >
      <RecommendedContent post={post} />
    </Suspense>
  );
}
