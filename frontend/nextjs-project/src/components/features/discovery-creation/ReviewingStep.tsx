"use client";

import { Box, Stack } from "@mui/material";
import React from "react";
import DiscoveryHeader from "@/components/ui/DiscoveryHeader";
import { formatTimestampForClient } from "@/utils/formatDate";
import DiscoveryImage from "@/components/ui/DiscoveryImage";
import { DISCOVERY_HEADER_HEIGHT } from "@/constants/styles";
import QuestionBubble from "@/components/ui/QuestioinBubble";
import Section from "@/components/ui/Section";
import { IoLeaf, IoSearch } from "react-icons/io5";
import { useDiscoveryCreationStore } from "@/stores/discoveryCreationStore";
import SubmitButton from "@/components/ui/SubmitButton";
import { useRouter } from "next/navigation";

export default function ReviewingStep() {
  const { photoData, question, aiResponse, prevStep, nextStep } =
    useDiscoveryCreationStore();
  const router = useRouter();

  const now = new Date();
  const { iconName, formattedDate } = formatTimestampForClient(now);

  const handleSave = () => {
    // ここで、実際のデータベースにデータを保存する非同期処理を呼び出します。
    // await saveDiscoveryToDatabase({ photoData, question, ... });
    console.log("データベースに保存処理が完了したと仮定します。");

    // ダミーの投稿IDを生成（実際にはDB保存後に返ってくるIDを使います）
    const newPostId = "a1b2c3d4-e5f6-7890-1234-567890abcdef";
    nextStep();
    router.push(`/discoveries/${newPostId}`);
  };

  // データがなければ何も表示しない（エラーハンドリング）
  if (!photoData || !question || !aiResponse) {
    return <p>データの読み込みに失敗しました。</p>;
  }

  return (
    <Box sx={{ px: 3 }}>
      <DiscoveryHeader
        iconName={iconName}
        formattedDate={formattedDate}
        onBackClick={prevStep}
      />
      <Stack
        spacing={4}
        sx={{
          color: "kinako.900",
          pt: `${DISCOVERY_HEADER_HEIGHT + 20}px`,
          pb: "20px",
        }}
      >
        <DiscoveryImage src={photoData} alt={question} />

        <QuestionBubble text={question} />

        <Section icon={<IoLeaf size={32} />} title={aiResponse.target}>
          {aiResponse.answer}
        </Section>

        <Section icon={<IoSearch size={32} />} title="問い">
          {aiResponse.toi}
        </Section>

        <SubmitButton onClick={handleSave}>記録する</SubmitButton>
      </Stack>
    </Box>
  );
}
