import { Tab, Tabs } from "@mui/material";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useFilterStore } from "@/stores/filterStore";

const tabStyles = {
  flexGrow: 1,
  borderRadius: "8px 8px 0px 0px",
  fontSize: "1rem",
  "&.Mui-selected": {
    backgroundColor: "yomogi.800",
    color: "gray.100",
  },
};

export default function HeaderTabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { sort: savedSort } = useFilterStore();

  // scopeは常にURLから取得
  const currentScope = searchParams.get("scope");

  // --- 地図タブ(/)のURLを生成 ---
  const mapParams = new URLSearchParams();
  if (currentScope) {
    mapParams.set("scope", currentScope);
  }
  const mapHref = `/?${mapParams.toString()}`.replace(/\?$/, ""); // 末尾の?を削除

  // --- 一覧タブ(/list)のURLを生成 ---
  const listParams = new URLSearchParams();
  if (currentScope) {
    listParams.set("scope", currentScope);
  }
  if (savedSort) {
    listParams.set("sort", savedSort);
  }
  const listHref = `/list?${listParams.toString()}`.replace(/\?$/, ""); // 末尾の?を削除

  return (
    <Tabs
      value={pathname}
      variant="fullWidth"
      slotProps={{ indicator: { sx: { display: "none" } } }}
      sx={{
        minHeight: "auto",
        color: "kinako.800",
      }}
    >
      <Tab
        label="地図"
        value="/"
        component={Link}
        href={mapHref}
        disableRipple
        sx={tabStyles}
      />
      <Tab
        label="一覧"
        value="/list"
        component={Link}
        href={listHref}
        disableRipple
        sx={tabStyles}
      />
    </Tabs>
  );
}
