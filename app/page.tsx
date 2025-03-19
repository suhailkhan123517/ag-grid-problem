"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import { AgGridReact } from "ag-grid-react";

// Import ag-Grid CSS
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

// Import ag-Grid Enterprise
import "ag-grid-enterprise";

// Import custom filter component
import { QuickFilter } from "@/components/quick-filter";

const ServerSideGrid = () => {
  const gridRef = useRef(null);
  const [pageSize, setPageSize] = useState(50);
  const [quickFilterText, setQuickFilterText] = useState("");
  const [loading, setLoading] = useState(false);

  // Column definitions
  const columnDefs = [
    { field: "id", headerName: "Student ID" },
    {
      field: "first_name",
      headerName: "First Name",
      filter: "agTextColumnFilter",
    },
    {
      field: "last_name",
      headerName: "Last Name",
      filter: "agTextColumnFilter",
    },
    {
      field: "school_name",
      headerName: "School Name",
      filter: "agTextColumnFilter",
    },
    {
      field: "specialised_subject",
      headerName: "Specialised Subject",
      filter: "agTextColumnFilter",
    },
    { field: "city", headerName: "City", filter: "agTextColumnFilter" },
    { field: "class", headerName: "Class", filter: "agNumberColumnFilter" },
    { field: "country", headerName: "Country", filter: "agTextColumnFilter" },
    {
      field: "fees_paid",
      headerName: "Fees Paid",
      filter: "agNumberColumnFilter",
      valueFormatter: (params) => `$${params.value}`,
    },
  ];

  // Default column definitions
  const defaultColDef = {
    flex: 1,
    minWidth: 130,
    filter: true,
    sortable: true,
    floatingFilter: true,
    suppressHeaderMenuButton: false,
  };

  // Create a datasource for server-side model
  const createServerSideDatasource = useCallback(() => {
    return {
      getRows: (params) => {
        console.log("[Datasource] - rows requested by grid: ", params.request);

        setLoading(true);

        try {
          // Extract request parameters
          const request = params.request;

          // Get filter model from request and make a copy to avoid reference issues
          const filterModel = { ...(request.filterModel || {}) };

          // Add quick filter explicitly if it exists
          if (quickFilterText && quickFilterText.trim() !== "") {
            filterModel.quickFilter = quickFilterText.trim();
          }

          // Log the complete request for debugging
          console.log("Full request to API:", {
            startRow: request.startRow,
            endRow: request.endRow,
            sortModel: request.sortModel || [],
            filterModel: filterModel,
          });

          // Fetch data from server
          fetch("/api/students", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              startRow: request.startRow,
              endRow: request.endRow,
              sortModel: request.sortModel || [],
              filterModel: filterModel,
            }),
          })
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              console.log("Data received:", data);

              // Check if we have valid data
              if (data && Array.isArray(data.rows)) {
                // Call the success callback
                params.success({
                  rowData: data.rows,
                  rowCount: data.lastRow,
                });
              } else {
                console.error("Invalid data format received:", data);
                params.fail();
              }
            })
            .catch((error) => {
              console.error("Error loading data:", error);
              params.fail();
            })
            .finally(() => {
              setLoading(false);
            });
        } catch (error) {
          console.error("Error in datasource:", error);
          params.fail();
          setLoading(false);
        }
      },
    };
  }, [quickFilterText]);

  // Grid ready handler
  const onGridReady = useCallback(
    (params) => {
      console.log("Grid ready, API methods:", Object.keys(params.api));

      // Create datasource
      const datasource = createServerSideDatasource();

      // Set the datasource using setGridOption instead of setServerSideDatasource
      if (params.api.setGridOption) {
        console.log("Using setGridOption for serverSideDatasource");
        params.api.setGridOption("serverSideDatasource", datasource);
      } else {
        console.error("setGridOption method not available");
      }
    },
    [createServerSideDatasource]
  );

  // Filter changed handler
  const onFilterChanged = useCallback(() => {
    console.log("Filter changed");

    // The server-side model should automatically request data with the new filters
    // But we can force a refresh to be sure
    if (gridRef.current && gridRef.current.api) {
      if (gridRef.current.api.refreshServerSideStore) {
        gridRef.current.api.refreshServerSideStore({ purge: true });
      }
    }
  }, []);

  // Quick filter handler
  const onQuickFilterChanged = useCallback(() => {
    const value = document.querySelector("#input-quick-filter")?.value || "";
    setQuickFilterText(value);

    // Refresh the grid data with the new filter
    if (gridRef.current && gridRef.current.api) {
      if (gridRef.current.api.refreshServerSideStore) {
        gridRef.current.api.refreshServerSideStore({ purge: true });
      } else if (gridRef.current.api.setGridOption) {
        // If refresh method isn't available, try setting the datasource again
        gridRef.current.api.setGridOption(
          "serverSideDatasource",
          createServerSideDatasource()
        );
      }
    }
  }, [createServerSideDatasource]);

  // Pagination changed handler
  const onPaginationChanged = useCallback(() => {
    console.log("Pagination changed");

    // Update page size if available
    if (gridRef.current?.api?.paginationGetPageSize) {
      const newPageSize = gridRef.current.api.paginationGetPageSize();
      setPageSize(newPageSize);
    }
  }, []);

  // Grid style
  const gridStyle = useMemo(() => ({ height: "500px", width: "100%" }), []);

  return (
    <div>
      <div className="mb-3 flex justify-between items-center">
        <QuickFilter onInput={onQuickFilterChanged} />
        <button
          onClick={() => {
            if (gridRef.current && gridRef.current.api) {
              if (gridRef.current.api.refreshServerSideStore) {
                gridRef.current.api.refreshServerSideStore({ purge: true });
              } else if (gridRef.current.api.setGridOption) {
                // If refresh method isn't available, try setting the datasource again
                gridRef.current.api.setGridOption(
                  "serverSideDatasource",
                  createServerSideDatasource()
                );
              }
            }
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      <div className="ag-theme-quartz" style={gridStyle}>
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-10">
            Loading...
          </div>
        )}
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          // Using Server-Side Row Model
          rowModelType="serverSide"
          // Pagination settings
          pagination={true}
          paginationPageSize={pageSize}
          paginationPageSizeSelector={[50, 100, 200]}
          // Cache settings
          cacheBlockSize={pageSize}
          maxBlocksInCache={10}
          // Event handlers
          onGridReady={onGridReady}
          onFilterChanged={onFilterChanged}
          onPaginationChanged={onPaginationChanged}
          // Row settings
          rowSelection={{ type: "multiple" }}
          getRowStyle={() => ({ cursor: "pointer" })}
          // UI components
          sideBar={{
            toolPanels: ["filters", "columns"],
            defaultToolPanel: "",
          }}
          // Debug mode
          debug={true}
        />
      </div>
    </div>
  );
};

export default ServerSideGrid;
