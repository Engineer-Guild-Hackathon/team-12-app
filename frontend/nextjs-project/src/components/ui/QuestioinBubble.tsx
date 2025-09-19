import { Paper, Typography } from "@mui/material";
import React from "react";

interface QuestionBubbleProps {
  text: string;
}

export default function QuestionBubble({ text }: QuestionBubbleProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: "relative",
        backgroundColor: "gray.100",
        borderRadius: 2,
        p: 2,
        mt: 2,

        "&::before": {
          content: '""',
          position: "absolute",
          top: "-30px",
          left: "8%",
          ml: "-15px",
          border: "15px solid transparent",
          borderBottom: "15px solid white",
        },
      }}
    >
      <Typography variant="body1" sx={{ fontSize: { xs: 13, sm: 15 } }}>
        {text}
      </Typography>
    </Paper>
  );
}
