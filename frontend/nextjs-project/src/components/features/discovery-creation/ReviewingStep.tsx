"use client";

import { Box, Stack, Checkbox, FormControlLabel } from "@mui/material";
import React, { useState } from "react";
import DiscoveryHeader from "@/components/ui/DiscoveryHeader";
import { formatTimestampForClient } from "@/utils/formatDate";
import DiscoveryImage from "@/components/ui/DiscoveryImage";
import {
  DISCOVERY_HEADER_HEIGHT,
  DISCOVERY_HEADER_HEIGHT_FOR_BROWSER,
} from "@/constants/styles";
import QuestionBubble from "@/components/ui/QuestioinBubble";
import Section from "@/components/ui/Section";
import { IoLeaf, IoSearch } from "react-icons/io5";
import { useDiscoveryCreationStore } from "@/stores/discoveryCreationStore";
import SubmitButton from "@/components/ui/SubmitButton";
import { useRouter } from "next/navigation";
import { useIsPWA } from "@/hooks/useIsPWA";

export default function ReviewingStep() {
  const { photoData, question, aiResponse, prevStep, nextStep } =
    useDiscoveryCreationStore();
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(true);
  const isPWA = useIsPWA();
  const discoveryHeaderHeight = isPWA
    ? DISCOVERY_HEADER_HEIGHT
    : DISCOVERY_HEADER_HEIGHT_FOR_BROWSER;

  const now = new Date();
  const { iconName, formattedDate } = formatTimestampForClient(now);

  const handleSave = () => {
    // ここで、実際のデータベースにデータを保存する非同期処理を呼び出します。
    // await saveDiscoveryToDatabase({ photoData, question, ... });
    console.log("データベースに保存処理が完了したと仮定します。");
    console.log(`公開設定: ${isPublic}`);

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
        spacing={3.5}
        sx={{
          color: "kinako.900",
          pt: `${discoveryHeaderHeight + 16}px`,
          pb: "56px",
        }}
      >
        <Stack spacing={3}>
          <DiscoveryImage src={photoData} alt={question} />
          <QuestionBubble text={question} />
        </Stack>

        <Stack spacing={2.5} pb={2.5}>
          <Section icon={<IoLeaf size={32} />} title="はっけん">
            {aiResponse.answer}
          </Section>

          <Section icon={<IoSearch size={32} />} title="問い">
            {aiResponse.toi}
          </Section>
        </Stack>

        <Stack spacing={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                name="isPublic"
                sx={{
                  color: "kinako.900",
                  "&.Mui-checked": { color: "kinako.900" },
                }}
              />
            }
            label="このはっけんを他のユーザーに公開する"
            sx={{
              color: "kinako.900",
              "& .MuiFormControlLabel-label": {
                fontSize: 14,
                lineHeight: 1.2,
              },
            }}
          />
          <SubmitButton onClick={handleSave}>記録する</SubmitButton>
        </Stack>
      </Stack>
    </Box>
  );
}
