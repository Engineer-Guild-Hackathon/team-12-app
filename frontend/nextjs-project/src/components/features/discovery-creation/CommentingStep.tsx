"use client";

import { Box, Stack, TextField } from "@mui/material";
import React from "react";
import DiscoveryHeader from "@/components/ui/DiscoveryHeader";
import { formatTimestampForClient } from "@/utils/formatDate";
import DiscoveryImage from "@/components/ui/DiscoveryImage";
import {
  DISCOVERY_HEADER_HEIGHT,
  DISCOVERY_HEADER_HEIGHT_FOR_BROWSER,
} from "@/constants/styles";
import { useForm, SubmitHandler } from "react-hook-form";
import SubmitButton from "@/components/ui/SubmitButton";
import { useIsPWA } from "@/hooks/useIsPWA";
import OverlayLoader from "@/components/features/loading/OverlayLoader";
import { isInvalidQuestion } from "@/utils/isInvalidQuestion";
import { red } from "@mui/material/colors";

const MAX_USER_QUESTION_LENGTH = 200;

interface CommentingStepProps {
  photo: string | null;
  isGenerating: boolean;
  onNext: (user_question: string) => void;
  onPrev: () => void;
}

type FormInputs = {
  user_question: string;
};

export default function CommentingStep({
  photo,
  isGenerating,
  onNext,
  onPrev,
}: CommentingStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInputs>({
    mode: "onChange",
  });
  const isPWA = useIsPWA();
  const discoveryHeaderHeight = isPWA
    ? DISCOVERY_HEADER_HEIGHT
    : DISCOVERY_HEADER_HEIGHT_FOR_BROWSER;

  const now = new Date();
  const { iconName, formattedDate } = formatTimestampForClient(now);

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    onNext(data.user_question);
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3 } }}>
      <DiscoveryHeader
        iconName={iconName}
        formattedDate={formattedDate}
        onBackClick={onPrev}
      />
      <Stack
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        spacing={4}
        sx={{
          color: "kinako.900",
          pt: `${discoveryHeaderHeight + 16}px`,
          pb: "56px",
        }}
      >
        {photo && <DiscoveryImage src={photo} alt="撮影した写真" />}
        <TextField
          placeholder="このキノコの名前は？"
          multiline
          rows={8}
          fullWidth
          error={!!errors.user_question}
          helperText={
            errors.user_question?.message ||
            "気づいたことやふしぎに思ったことを自由に書き出して、はっけんについてAIに聞いてみましょう"
          }
          {...register("user_question", {
            required: "コメントは入力必須です",
            maxLength: {
              value: MAX_USER_QUESTION_LENGTH,
              message: `コメントは${MAX_USER_QUESTION_LENGTH}文字以内で入力してください`,
            },
            pattern: {
              value: /^[^<>"]+$/,
              message: "入力できない記号が含まれています",
            },
            validate: (value) =>
              !isInvalidQuestion(value) ||
              "不適切な表現が含まれる可能性があります",
          })}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "gray.100",
              borderRadius: "8px",
              fontSize: { xs: 14, sm: 16 },

              "&:hover .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
              "& .MuiInputBase-input::placeholder": {
                color: "kinako.700",
                opacity: 1,
              },
            },
            "& .MuiOutlinedInput-notchedOutline": {
              border: "none",
            },
            "& .MuiFormHelperText-root": {
              color: "kinako.800",
              fontSize: { xs: 12, sm: 14 },
              "&.Mui-error": {
                color: red[300],
              },
            },
          }}
        />
        {/* <SubmitButton isLoading={isGenerating} loadingText={"AIが考えています"}>
          次へ
        </SubmitButton> */}
        <SubmitButton disabled={isGenerating}>次へ</SubmitButton>
      </Stack>
      {isGenerating && <OverlayLoader message="AIが考えています..." />}
    </Box>
  );
}
