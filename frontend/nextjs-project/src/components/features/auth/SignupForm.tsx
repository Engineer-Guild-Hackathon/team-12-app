"use client";

import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Stack,
  FormControl,
  OutlinedInput,
  FormHelperText,
} from "@mui/material";
import { PiPlant } from "react-icons/pi";
import { FaDiamond } from "react-icons/fa6";

// フォームのデータ型を定義
type FormInputs = {
  username: string;
};

export default function SignupForm() {
  const router = useRouter();

  // React Hook Formを初期化
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInputs>({
    mode: "onChange", // 入力中にバリデーションを実行
  });

  // バリデーション成功時に実行される関数
  const onSubmit = async (data: FormInputs) => {
    console.log("ユーザー登録中...", data);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("登録完了:", data.username);
    router.push("/");
  };

  return (
    <Stack
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      spacing={4}
      sx={{
        paddingTop: "100px",
        px: "10%",
        width: "100%",
        maxWidth: 400,
        mx: "auto",
      }}
    >
      {/* ヘッダー部分 */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          width: "100%",
          justifyContent: "center",
          pr: "24px",
          pb: "10px",
          borderBottom: "1px solid",
          borderColor: "kinako.700",
          color: "yomogi.600",
        }}
      >
        <PiPlant size={24} />
        <Typography
          sx={{
            fontSize: 24,
            color: "kinako.800",
            lineHeight: 1.2,
          }}
        >
          新規登録
        </Typography>
      </Box>

      {/* ユーザー名入力部分 */}
      <Box sx={{ width: "100%" }}>
        <Box
          component="label"
          htmlFor="username-input"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            mb: "12px",
            color: "yomogi.600",
            cursor: "pointer",
          }}
        >
          <FaDiamond size={16} />
          <Typography sx={{ color: "kinako.900" }}>アカウント名</Typography>
        </Box>

        <FormControl fullWidth variant="outlined" error={!!errors.username}>
          <OutlinedInput
            id="username-input"
            fullWidth
            placeholder="名前を入力してください"
            {...register("username", {
              required: "アカウント名は入力必須です",
              maxLength: {
                value: 10,
                message: "10文字以内で入力してください",
              },
              pattern: {
                value: /^[^<>"]+$/,
                message: '入力できない記号が含まれています',
              },
              validate: (value: string) =>
                value.trim() !== "" || "空白文字のみの入力はできません",
            })}
            sx={{
              borderRadius: "8px",
              backgroundColor: "gray.100",
              "& .MuiOutlinedInput-notchedOutline": {
                border: "none",
              },
            }}
          />
          <FormHelperText sx={{ marginLeft: 0 }}>
            {errors.username?.message || "※10文字まで入力できます"}
          </FormHelperText>
        </FormControl>
      </Box>

      {/* 登録ボタン */}
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        sx={{
          borderRadius: 200,
          backgroundColor: "kinako.900",
          color: "gray.100",
          py: 1.6,
          boxShadow: "none",
          textTransform: "none",
          width: "80%",
          alignSelf: "center",
          "&:hover": {
            transform: "translateY(-3px) scale(1.02)",
            boxShadow: "none",
            backgroundColor: "kinako.900",
          },
        }}
      >
        {isSubmitting && (
          <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
        )}
        <Typography fontSize={20}>
          {isSubmitting ? "登録中..." : "登録"}
        </Typography>
      </Button>
    </Stack>
  );
}
