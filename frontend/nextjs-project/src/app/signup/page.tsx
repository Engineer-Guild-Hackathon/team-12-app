'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, TextField, Button } from "@mui/material";
import { PiPlant } from "react-icons/pi";
import { FaDiamond } from "react-icons/fa6";
import { useTheme } from '@mui/material/styles';

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const theme = useTheme();

  const handleSignUp = async () => {
    if (username.trim() === "") {
      alert("ユーザー名を入力してください");
      return;
    }

    console.log("ユーザー登録中...");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("登録完了:", username);
    router.push("/");
  }


  return (
    <Box 
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        paddingTop: "100px",
        px: "10%",
      }}>

        {/* ヘッダー部分 */}
        <Box
          sx={{ 
            display: "flex",
            alignItems: "center",
            gap: "10px",
            mb: "40px",
            width: "100%",
            justifyContent: "center",
            pr: "24px",
            pb: "10px",
            borderBottom: "1px solid",
            borderColor: "kinako.700",
          }}
        >
          <PiPlant color={theme.palette.yomogi[600]} size={24}/>
          <Typography
            sx={{
              fontSize: 24,
              color: "kinako.800",
            }}
          >
            新規登録
          </Typography>
        </Box>

        {/* ユーザー名入力部分 */}
        <Box
          sx={{
            width: "100%",
            alignItems: "center",
            mb: "80px",
        }} >
          <Box
            sx={{ 
            display: "flex",
            alignItems: "center",
            gap: "6px",
            mb: "12px",
            }}>
            <FaDiamond color={theme.palette.yomogi[600]} size={16}/>
            <Typography >
              アカウント名
            </Typography>
          </Box>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="名前を入力してください"
           sx={{
            // height: 64,
            borderRadius: "8px",
            backgroundColor: 'gray.100',
            mb: "8px",
            '& .MuiOutlinedInput-root': {
              '&.Mui-focused': {
                boxShadow: 'none', // フォーカス時のハイライトシャドウを消す
              },
              '& fieldset': {
                border: 'none', // 通常時の枠線を消す
              },
              '&:hover fieldset': {
                border: 'none', // ホバー時の枠線を消す
              },
              '&.Mui-focused fieldset': {
                border: 'none', // フォーカス時の枠線を消す
              },
              '& .MuiOutlinedInput-input': {
                height: '64px', // ① TextField全体の高さを指定
                padding: '0 12px', // ② 上下のpaddingを0にして中央揃えを実現
                boxSizing: 'border-box', // paddingを含めて高さを計算
              },
            },
          }}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
         />
         <Typography
            sx={{
              fontSize: 14,
              color: "kinako.900",
            }}>
            ※全角8文字まで入力できます
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={handleSignUp}
          sx={{
            width: "80%",
            maxWidth: 340,
            borderRadius: 200,
            backgroundColor: "kinako.900",
            color: "gray.100",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            lineHeight: 1.2,
            py: 1.6,
            gap: 1,
            boxShadow: "none",
            textTransform: "none",
            "&:hover": {
              transform: "translateY(-3px) scale(1.02)",
              boxShadow: "none",
            },
          }}
        >
          <Typography fontSize={20}>
            登録
          </Typography>
        </Button>
      </Box>
  );
}
