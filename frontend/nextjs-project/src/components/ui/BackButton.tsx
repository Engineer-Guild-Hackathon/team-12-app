"use client";

import { IconButton, IconButtonProps } from "@mui/material";
import { useRouter } from "next/navigation";
import React from "react";
import { IoIosArrowBack } from "react-icons/io";

type BackButtonProps = IconButtonProps;

export default function BackButton(props: BackButtonProps) {
  const router = useRouter();
  const { onClick, ...otherProps } = props;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // もし親からonClickが渡されていたら、それを実行
    if (onClick) {
      onClick(event);
    } else {
      // 渡されていなければ、デフォルトのrouter.back()を実行
      router.back();
    }
  };

  return (
    <IconButton onClick={handleClick} {...otherProps}>
      <IoIosArrowBack size={24} />
    </IconButton>
  );
}
