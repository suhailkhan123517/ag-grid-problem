"use client";

import dynamic from "next/dynamic";

const AgGridProvider = dynamic(() => import("@/providers/ag-grid-provider"), {
  ssr: false,
});

export default function AgGridWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AgGridProvider>{children}</AgGridProvider>;
}
