"use client";

import { parseAsInteger, useQueryState } from "nuqs";
import {
  ChevronsLeftIcon,
  ChevronsRightIcon,
  ListCheckIcon,
} from "lucide-react";

import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface PaginationControlProps {
  defaultLimit: number;
  limits: string[];
  total: number;
}

export const PaginationControl = ({
  total,
  defaultLimit,
  limits,
}: PaginationControlProps) => {
  const [limit, setLimit] = useQueryState(
    "limit",
    parseAsInteger.withDefault(defaultLimit)
  );

  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  const strLimit = limit.toString();

  const handleNext = () => {
    const totalPages = Math.ceil(total ?? 0 / limit);
    if (page < totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const onChangeLimit = (value: string) => {
    setLimit(parseInt(value));
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      <div className="flex items-center gap-x-2 justify-end p-2 rounded-xl">
        <Select
          defaultValue={strLimit}
          onValueChange={(value) => onChangeLimit(value)}
        >
          <SelectTrigger className="w-[100px] bg-background">
            <div className=" flex items-center pr-2">
              <ListCheckIcon className="size-4 mr-2" />
              <SelectValue placeholder="Select Limit" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Select Limit</SelectItem>
            <SelectSeparator />
            {limits.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size={"sm"} onClick={handlePrevious} disabled={page === 1}>
          <ChevronsLeftIcon className="size-4" />
        </Button>
        <p className="text-sm">
          Page {page} of {totalPages}
        </p>
        <Button size={"sm"} onClick={handleNext} disabled={page >= totalPages}>
          <ChevronsRightIcon className="size-4" />
        </Button>
      </div>
    </>
  );
};
