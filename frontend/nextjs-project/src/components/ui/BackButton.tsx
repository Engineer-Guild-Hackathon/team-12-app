import { IconButton, IconButtonProps } from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";
import { IoIosArrowBack } from "react-icons/io";

type BackButtonProps = IconButtonProps;

export default function BackButton(props: BackButtonProps) {
  const router = useRouter();

  return (
    <IconButton onClick={() => router.back()} {...props}>
      <IoIosArrowBack size={24} />
    </IconButton>
  );
}
