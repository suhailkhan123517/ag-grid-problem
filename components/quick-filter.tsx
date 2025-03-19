import React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface QuickFilterProps {
  onInput: () => void;
}

export const QuickFilter: React.FC<QuickFilterProps> = ({ onInput }) => {
  return (
    <div className="relative w-96">
      <Search className="h-4 w-4 absolute left-2 top-3 text-gray-500" />
      <Input
        id="input-quick-filter"
        placeholder="Search anything..."
        className="pl-8"
        onInput={onInput}
      />
    </div>
  );
};
