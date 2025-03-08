"use client";

import { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";

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
  const [rowData, setRowData] = useState<RowDataT[]>([]);

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
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/ag-grid`)
      .then((res) => res.json())
      .then((data) => {
        console.log("API Response:", data);
        setRowData(data.products);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, []);

  const getRowId = useCallback((params: any) => params.data.nItemID, []);

  return (
    <>
      <div className={"ag-theme-quartz"} style={gridStyle}>
        <AgGridReact<RowDataT>
          ref={gridRef}
          rowData={rowData}
          getRowId={getRowId}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          rowSelection="multiple"
          getRowStyle={() => ({ cursor: "pointer" })}
          sideBar={{
            toolPanels: ["filters", "columns"],
            defaultToolPanel: "",
          }}
        />
      </div>
    </>
  );
};

export default ServerSideGrid;
