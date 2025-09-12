"use client";

import { Box, Stack, TextField } from "@mui/material";
import React from "react";
import DiscoveryHeader from "@/components/ui/DiscoveryHeader";
import { formatTimestampForClient } from "@/utils/formatDate";
import DiscoveryImage from "@/components/ui/DiscoveryImage";
import { DISCOVERY_HEADER_HEIGHT } from "@/constants/styles";
import { useForm, SubmitHandler } from "react-hook-form";
import SubmitButton from "@/components/ui/SubmitButton";

interface CommentingStepProps {
  photo: string | null;
  isGenerating: boolean;
  onNext: (question: string) => void;
  onPrev: () => void;
}

type FormInputs = {
  question: string;
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
  } = useForm<FormInputs>();

  const now = new Date();
  const { iconName, formattedDate } = formatTimestampForClient(now);

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    onNext(data.question);
  };

  return (
    <Box sx={{ px: 3 }}>
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
          pt: `${DISCOVERY_HEADER_HEIGHT + 16}px`,
          pb: "56px",
        }}
      >
        {photo && <DiscoveryImage src={photo} alt="撮影した写真" />}
        <TextField
          placeholder="このキノコの名前は？"
          multiline
          rows={8}
          fullWidth
          error={!!errors.question}
          helperText={
            errors.question?.message ||
            "気づいたことやふしぎに思ったことを自由に書き出して、はっけんについてAIに聞いてみましょう"
          }
          {...register("question", { required: "コメントは入力必須です" })}
          sx={{
            "& .MuiOutlinedInput-root": {
              backgroundColor: "gray.100",
              borderRadius: "8px",

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
            },
          }}
        />
        <SubmitButton isLoading={isGenerating} loadingText={"AIが考えています"}>
          次へ
        </SubmitButton>
      </Stack>
    </Box>
  );
}
