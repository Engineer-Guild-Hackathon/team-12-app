"use client";

import {
  BottomNavigationAction,
  BottomNavigationActionProps,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

interface NavActionButtonProps extends BottomNavigationActionProps {
  href: string;
  activeIcon: React.ReactElement;
  inactiveIcon: React.ReactElement;
}

const navActionStyles = {
  color: "kinako.900",
  py: 1,
  justifyContent: "start",
  "&.Mui-selected": {
    color: "kinako.900",
  },
  "& .MuiBottomNavigationAction-label": {
    fontSize: "0.875rem",
  },
};

const NavActionButton = React.forwardRef<
  HTMLButtonElement,
  NavActionButtonProps
>(function NavActionButton(props, ref) {
  const { href, activeIcon, inactiveIcon, ...otherProps } = props;

  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" || pathname === "/list" : pathname === href;

  return (
    <BottomNavigationAction
      ref={ref}
      component={Link}
      href={href}
      icon={isActive ? activeIcon : inactiveIcon}
      sx={navActionStyles}
      {...otherProps}
    />
  );
});

export default NavActionButton;
