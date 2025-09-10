'use client';

import { Box, Button, Typography } from "@mui/material";
import Image from "next/image";
import { useRouter } from "next/navigation";
import logo from "../../../public/logo.svg";

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    console.log('ユーザーが登録済みかサーバーに問い合わせ中');
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    const isRegistered = Math.random() < 0.5; //一旦ランダムに登録済み/未登録を決定
    
    if (isRegistered) {
      console.log('登録済み');
      router.push('/');
    } else {
      console.log('未登録');
      router.push('/signup');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: '100vh',
        paddingTop: "240px", 
        px: '10%',
      }}
      >
        <Box sx={{
          mb: "24px",
        }}><Image src={logo} alt="Logo" width={200} height={113} /></Box>
      <Typography variant="h3" fontSize={20} color='kinako.800' mt={2} textAlign="center">
        道端に光る「どうして？」を
        <br />
        見つけにいこう。
        <br />
        AIカメラと問いで作る
        <br />
        新しい散歩地図。
      </Typography>
      <Button variant="contained" onClick={handleLogin}
        sx={{
          width: '100%',
          borderRadius: 200,
          marginTop: '80px',
          backgroundColor: 'yomogi.800',
          color: 'gray.100',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center', // 縦方向の中央揃え
          alignItems: 'center',     // 横方向の中央揃え
          lineHeight: 1.2,  
          py: 4,
          gap: 1, 
        }}
        >
        <Typography fontSize={20}>はじめる</Typography>
        <Typography fontSize={12}>Googleアカウントで認証する</Typography>
      </Button>
    </Box>
  );
}