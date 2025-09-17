"use client";

import {
  Box,
  Stack,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import Link from "next/link";
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
import { useReviewingStep } from "@/hooks/useReviewingStep";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useIsPWA } from "@/hooks/useIsPWA";

export default function ReviewingStep() {
  // TODO: useDiscoveryCreationStoreに型付けを行う
  const params = useDiscoveryCreationStore();
  const currentLocation = useGeolocation();
  const { handleSave } = useReviewingStep({ ...params, ...currentLocation });
  const { photoData, user_question, aiResponse, prevStep } = params;
  const [isPublic, setIsPublic] = useState(true);
  const isPWA = useIsPWA();
  const discoveryHeaderHeight = isPWA
    ? DISCOVERY_HEADER_HEIGHT
    : DISCOVERY_HEADER_HEIGHT_FOR_BROWSER;

  const now = new Date();
  const { iconName, formattedDate } = formatTimestampForClient(now);

  // データがなければ何も表示しない（エラーハンドリング）
  if (!photoData || !user_question || !aiResponse) {
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
          <DiscoveryImage src={photoData} alt={user_question} />
          <QuestionBubble text={user_question} />
        </Stack>

        <Stack spacing={2.5} pb={2.5}>
          <Section icon={<IoLeaf size={32} />} title="はっけん">
            {aiResponse.ai_answer}
            {Array.isArray(aiResponse.grounding_urls) &&
              aiResponse.grounding_urls.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {aiResponse.grounding_urls.map((url, idx) => (
                    <Typography
                      key={idx}
                      variant="body2"
                      sx={{ display: "block" }}
                    >
                      {aiResponse.grounding_urls.length === 1
                        ? "AIが参考にしたサイト"
                        : `AIが参考にしたサイト${idx + 1}`}
                      ：
                      <Link
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {url}
                      </Link>
                    </Typography>
                  ))}
                </Box>
              )}
          </Section>

          <Section icon={<IoSearch size={32} />} title="問い">
            {aiResponse.ai_question}
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
