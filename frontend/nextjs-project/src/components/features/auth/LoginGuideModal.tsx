"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Typography,
  useTheme,
} from "@mui/material";
import { useRouter } from "next/navigation";
import logo from "../../../../public/logo.svg";
import Image from "next/image";
import { Box, Stack } from "@mui/material";
import { PiCamera, PiLeaf } from "react-icons/pi";
import { IoClose } from "react-icons/io5";

type LoginGuideModalProps = { open: boolean; closeModal: () => void };

export default function LoginGuideModal({
  open,
  closeModal,
}: LoginGuideModalProps) {
  const router = useRouter();
  const theme = useTheme();

  // TODO: ページ遷移中にローディングマークつけたい
  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          width: "400px",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "20px",
        },
      }}
      keepMounted
    >
      <Box
        sx={{ display: "flex", flexDirection: "row-reverse", height: "12px" }}
      >
        <IoClose size={20} onClick={closeModal} cursor="pointer" />
      </Box>
      <DialogContent
        sx={{
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          padding: "0",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image src={logo} alt="Logo" width={200} height={113} />
        </Box>
        <Box>
          <Typography
            variant="h2"
            component="h2"
            sx={{ textAlign: "center", mb: 2, fontSize: 24 }}
          >
            はっけんを記録しよう
          </Typography>
          <Typography variant="h4" component="h4" sx={{ fontSize: 14 }}>
            ログインすることで、以下の機能が解放されます
          </Typography>
        </Box>
        <Stack spacing={2} sx={{ mb: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 2,
              backgroundColor: "yomogi.200",
              padding: "12px",
              borderRadius: "8px",
              height: "52px",
            }}
          >
            <PiCamera size={32} color={theme.palette.yomogi["600"]} />
            <Typography variant="body2" color="yomogi.800">
              はっけんを記録する
            </Typography>
          </Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mt: 2,
              backgroundColor: "tamago.200",
              padding: "12px",
              borderRadius: "8px",
              height: "52px",
            }}
          >
            <PiLeaf size={32} color={theme.palette.tamago["600"]} />
            <Typography variant="body2" color="tamago.800">
              自分のはっけんを見る
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", padding: "0" }}>
        <Button
          variant="contained"
          onClick={() => router.push("/login")}
          autoFocus
          sx={{
            backgroundColor: "kinako.900",
            color: "white",
            "&:hover": {
              backgroundColor: "kinako.700",
            },
            padding: "8px 16px",
            height: "56px",
            width: "80%",
            borderRadius: "200px",
            textTransform: "none",
            fontSize: "20px",
            alignSelf: "center",
          }}
        >
          ログインする
        </Button>
      </DialogActions>
    </Dialog>
  );
}
