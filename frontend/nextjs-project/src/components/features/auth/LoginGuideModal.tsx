"use client";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useRouter } from "next/navigation";

type Props = { open: boolean };

export default function LoginGuideModal({ open }: Props) {
  const router = useRouter();

  // TODO: ページ遷移中にローディングマークつけたい
  return (
    <Dialog open={open} fullWidth keepMounted>
      <DialogTitle sx={{ textAlign: "center" }}>ログインが必要です</DialogTitle>
      <DialogContent sx={{ textAlign: "center" }}>
        <Typography variant="body2">
          この機能を利用するにはログインしてください。
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "center" }}>
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
          ログインページへ進む
        </Button>
      </DialogActions>
    </Dialog>
  );
}
