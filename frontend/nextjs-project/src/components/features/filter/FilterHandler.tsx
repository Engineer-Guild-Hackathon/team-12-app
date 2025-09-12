"use client";

import React, { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFilterStore } from "@/stores/filterStore";
import Header from "@/components/features/header/Header";
import FilterDrawer from "@/components/features/filter/FilterDrawer";

// 選択肢の定義
const sortOptions = [
  { value: "recommended", label: "おすすめ順" },
  { value: "nearest", label: "近い順" },
  { value: "newest", label: "新しい順" },
  { value: "oldest", label: "古い順" },
];
const scopeOptions = [
  { value: "all", label: "全員" },
  { value: "mine", label: "自分" },
];

export default function FilterHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const { sort: currentSort, setSort } = useFilterStore();
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const isFilterEnabled = pathname === "/" || pathname === "/list";

  const currentScope = searchParams.get("scope") || "all";
  const handleScopeChange = (scopeValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", scopeValue);
    router.push(`${pathname}?${params.toString()}`);
  };

  const isSortEnabled = pathname === "/list";
  const handleSortChange = (sortValue: string) => {
    setSort(sortValue);
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sortValue);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      <Header
        onFilterClick={
          isFilterEnabled ? () => setIsFilterDrawerOpen(true) : undefined
        }
      />
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onOpen={() => setIsFilterDrawerOpen(true)}
        isSortEnabled={isSortEnabled}
        currentSort={currentSort}
        onSortChange={handleSortChange}
        sortOptions={sortOptions}
        currentScope={currentScope}
        onScopeChange={handleScopeChange}
        scopeOptions={scopeOptions}
      />
    </>
  );
}