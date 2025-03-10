"use client";

import { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";

import { QuickFilter } from "@/components/quick-filter";
import { PaginationControl } from "@/components/pagination-control";

import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

interface RowDataT {
  nItemID: number;
  sBrand: string;
  sCode: string;
  sCoreMaterial: string;
  sFinish: string;
  sName: string;
}

const ServerSideGrid = () => {
  const [total, setTotal] = useState(0);
  const [rowData, setRowData] = useState<RowDataT[]>([]);

  const [page] = useQueryState("page", parseAsInteger.withDefault(1));
  const [limit] = useQueryState("limit", parseAsInteger.withDefault(50));

  const gridRef = useRef<AgGridReact<RowDataT>>(null);
  const gridStyle = useMemo(() => ({ height: "67vh", width: "100%" }), []);

  const colDefs: ColDef<RowDataT>[] = useMemo(
    () => [
      { field: "nItemID", headerName: "Item ID" },
      { field: "sBrand", headerName: "Brand" },
      { field: "sCode", headerName: "Code" },
      { field: "sCoreMaterial", headerName: "Core Material" },
      { field: "sFinish", headerName: "Finish" },
      { field: "sName", headerName: "Name" },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      flex: 1,
      minWidth: 130,
      filter: true,
      sortable: true,
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/api/ag-grid?limit=${limit}&page=${page}`
        );
        const data = await response.json();
        console.log("API Response:", data);

        setRowData(data.products);
        setTotal(data.totalCount);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [limit, page]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getRowId = useCallback((params: any) => params.data.nItemID, []);

  const onQuickFilter = useCallback(() => {
    gridRef.current!.api.setGridOption(
      "quickFilterText",
      document.querySelector<HTMLInputElement>("#input-quick-filter")?.value
    );
  }, []);

  const code = `export async function GET(req: Request) {
    try {
      const origin = req.headers.get("Origin");
      const allowedOrigin = allowedOrigins.includes(origin || "")
        ? origin
        : undefined;
  
      const { searchParams } = new URL(req.url);
      const page = searchParams.get("page") || "1";
      const limit = searchParams.get("limit") || "50";
  
      const parsedPage = Math.max(parseInt(page, 10), 1);
      const parsedLimit = Math.max(parseInt(limit, 10), 1);
      const offset = (parsedPage - 1) * parsedLimit;
  
      const products = await db.mitem.findMany({
        where: {
          nCompanyID: 113,
          bCustom: 0,
        },
        skip: offset,
        take: parsedLimit,
        select: {
          nItemID: true,
          sBrand: true,
          sCode: true,
          sCoreMaterial: true,
          sFinish: true,
          sName: true,
        },
        orderBy: {
          dtCreated: "desc",
        },
      });
  
      const totalCount = await db.mitem.count({
        where: {
          nCompanyID: 113,
        },
      });
  
      return NextResponse.json(
        { products, totalCount },
        { headers: { "Access-Control-Allow-Origin": allowedOrigin || "" } }
      );
    } catch (error) {
      console.log("error :>> ", error);
      return new NextResponse("Internal Server Error", { status: 500 });
    }
  }
  `;

  return (
    <>
      <div className="mb-3">
        <QuickFilter onInput={onQuickFilter} />
      </div>
      <div className={"ag-theme-quartz"} style={gridStyle}>
        <AgGridReact<RowDataT>
          ref={gridRef}
          rowData={rowData}
          getRowId={getRowId}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={50}
          paginationPageSizeSelector={[50, 100, 200]}
          rowSelection="multiple"
          getRowStyle={() => ({ cursor: "pointer" })}
          sideBar={{
            toolPanels: ["filters", "columns"],
            defaultToolPanel: "",
          }}
        />
      </div>
      <div className="flex items-center justify-between">
        <Badge> No fo Total Rows: {total}</Badge>
        <PaginationControl
          defaultLimit={50}
          limits={["50", "100", "200"]}
          total={total}
        />
      </div>
      <div>
        <CodeBlock
          language="ts"
          filename="/api/ag-grid/route.ts"
          highlightLines={[9, 13, 14, 18]}
          code={code}
        />
      </div>
    </>
  );
};

export default ServerSideGrid;
