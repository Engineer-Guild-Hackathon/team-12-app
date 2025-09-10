'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, TextField, Button } from "@mui/material";
import { PiPlant } from "react-icons/pi";

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = useState("");

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
        <Box
          sx={{ 
            display: "flex",
            alignItems: "center",
            gap: "10px" }}
        >
          <PiPlant />
          <Typography
          >
            新規登録
          </Typography>
        </Box>

        <Box>
          <Typography>
            アカウント名
          </Typography>
          <TextField
            variant="outlined"
            placeholder="名前を入力してください"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
         />
         <Typography>
            ※全角8文字まで入力できます
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleSignUp}
        >
          <Typography>
            登録
          </Typography>
        </Button>
      </Box>
  );
}
