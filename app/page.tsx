"use client";

import { ColDef } from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { useEffect, useState, useMemo, useRef, useCallback } from "react";

import { QuickFilter } from "@/components/quick-filter";

import "ag-grid-enterprise";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  school_name: string;
  specialised_subject: string;
  city: string;
  class: number;
  country: string;
  fees_paid: number;
}

const ServerSideGrid = () => {
  const [rowData, setRowData] = useState<StudentData[]>([]);

  const gridRef = useRef<AgGridReact<StudentData>>(null);
  const gridStyle = useMemo(() => ({ height: "500px", width: "100%" }), []);

  const colDefs: ColDef<StudentData>[] = useMemo(
    () => [
      { field: "id", headerName: "Student ID" },
      { field: "first_name", headerName: "First Name" },
      { field: "last_name", headerName: "Last Name" },
      { field: "school_name", headerName: "School Name" },
      { field: "specialised_subject", headerName: "Specialised Subject" },
      { field: "city", headerName: "City" },
      { field: "class", headerName: "Class" },
      { field: "country", headerName: "Country" },
      {
        field: "fees_paid",
        headerName: "Fees Paid",
        valueFormatter: (params) => `$${params.value}`,
      },
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
        const response = await fetch(`/api/students`);
        const data = await response.json();
        console.log("API Response:", data);
        setRowData(data); // ✅ FIX: Set the correct array
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    console.log("Row Data Updated:", rowData);
  }, [rowData]);

  const getRowId = useCallback((params: any) => params.data?.id, []);

  const onQuickFilter = useCallback(() => {
    gridRef.current!.api.setGridOption(
      "quickFilterText",
      document.querySelector<HTMLInputElement>("#input-quick-filter")?.value
    );
  }, []);

  return (
    <>
      <div className="mb-3">
        <QuickFilter onInput={onQuickFilter} />
      </div>
      <div className={"ag-theme-quartz"} style={gridStyle}>
        <AgGridReact<StudentData>
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
    </>
  );
};

export default ServerSideGrid;
