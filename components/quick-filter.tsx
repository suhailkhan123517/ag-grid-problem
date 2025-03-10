"use client";

import { SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";

interface QuickFilterProps {
  onInput: () => void;
}

export const QuickFilter = ({ onInput }: QuickFilterProps) => {
  return (
    <>
      <div className="relative">
        <SearchIcon className="size-4 absolute top-[10px] left-2" />
        <Input
          type="text"
          id="input-quick-filter"
          onInput={onInput}
          className="border py-1 rounded-md pl-8  w-[200px] md:w-[250px] bg-background text-xs md:text-sm"
          placeholder="Quick filter anywhere..."
        />
      </div>
    </>
  );
};
