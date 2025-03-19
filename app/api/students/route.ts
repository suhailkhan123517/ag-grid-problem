import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { startRow, endRow, sortModel, filterModel } = body;

    console.log("API Request:", { startRow, endRow, sortModel, filterModel });

    // Build query options
    let queryOptions = {
      skip: startRow || 0,
      take: (endRow || 50) - (startRow || 0),
      orderBy: {},
      where: {},
    };

    // Process sorting
    if (sortModel && sortModel.length > 0) {
      const { colId, sort } = sortModel[0];
      // Ensure we have a valid sort direction
      const sortDirection = sort?.toLowerCase() === "desc" ? "desc" : "asc";

      queryOptions.orderBy = {
        [colId]: sortDirection,
      };
    } else {
      // Default sorting
      queryOptions.orderBy = {
        first_name: "asc",
      };
    }

    // Process filtering
    if (filterModel) {
      const whereConditions = {};
      const orConditions = [];

      // Handle quick filter separately
      if (filterModel.quickFilter) {
        const quickFilterValue = filterModel.quickFilter.trim();
        if (quickFilterValue) {
          // Create OR conditions for text fields
          // Remove mode: "insensitive" as it's not supported
          orConditions.push(
            { first_name: { contains: quickFilterValue } },
            { last_name: { contains: quickFilterValue } },
            { school_name: { contains: quickFilterValue } },
            { city: { contains: quickFilterValue } },
            { country: { contains: quickFilterValue } },
            { specialised_subject: { contains: quickFilterValue } }
          );

          // Try to convert to number for numeric fields if it is a number
          const numValue = parseFloat(quickFilterValue);
          if (!isNaN(numValue)) {
            orConditions.push(
              { class: { equals: numValue } },
              { fees_paid: { equals: numValue } }
            );
          }
        }
        // Remove quickFilter from filterModel to avoid processing it twice
        delete filterModel.quickFilter;
      }

      // Process individual column filters
      for (const field in filterModel) {
        const filter = filterModel[field];

        // Skip if filter is null, undefined, or not a recognized field
        if (!filter || typeof filter !== "object") continue;

        // Skip the quick filter which we already processed
        if (field === "quickFilter") continue;

        // Handle different filter types
        try {
          if (filter.filterType === "text") {
            // Handle text filters
            const condition = filter.type || "contains";
            const filterValue = filter.filter || "";

            if (condition === "contains") {
              whereConditions[field] = { contains: filterValue };
            } else if (condition === "equals") {
              whereConditions[field] = { equals: filterValue };
            } else if (condition === "startsWith") {
              whereConditions[field] = { startsWith: filterValue };
            } else if (condition === "endsWith") {
              whereConditions[field] = { endsWith: filterValue };
            } else if (condition === "notContains") {
              whereConditions[field] = { not: { contains: filterValue } };
            } else if (condition === "notEqual") {
              whereConditions[field] = { not: { equals: filterValue } };
            }
          } else if (filter.filterType === "number") {
            // Handle number filters
            const condition = filter.type || "equals";
            const filterValue = parseFloat(filter.filter);

            if (isNaN(filterValue)) continue;

            if (condition === "equals") {
              whereConditions[field] = { equals: filterValue };
            } else if (condition === "notEqual") {
              whereConditions[field] = { not: { equals: filterValue } };
            } else if (condition === "greaterThan") {
              whereConditions[field] = { gt: filterValue };
            } else if (condition === "greaterThanOrEqual") {
              whereConditions[field] = { gte: filterValue };
            } else if (condition === "lessThan") {
              whereConditions[field] = { lt: filterValue };
            } else if (condition === "lessThanOrEqual") {
              whereConditions[field] = { lte: filterValue };
            } else if (condition === "inRange") {
              const toValue = parseFloat(filter.filterTo);
              if (!isNaN(toValue)) {
                whereConditions[field] = {
                  gte: filterValue,
                  lte: toValue,
                };
              }
            }
          } else {
            // Direct filtering approach as fallback
            console.log(
              `Using fallback filter approach for field: ${field}`,
              filter
            );

            if (filter.type === "contains") {
              whereConditions[field] = { contains: filter.filter };
            } else if (filter.type === "equals") {
              // Check if it's a numeric field
              if (["class", "fees_paid", "id"].includes(field)) {
                const numValue = parseFloat(filter.filter);
                if (!isNaN(numValue)) {
                  whereConditions[field] = { equals: numValue };
                }
              } else {
                // Text fields
                whereConditions[field] = { equals: filter.filter };
              }
            } else if (filter.type === "startsWith") {
              whereConditions[field] = { startsWith: filter.filter };
            } else if (filter.type === "endsWith") {
              whereConditions[field] = { endsWith: filter.filter };
            }
            // Number filters
            else if (filter.type === "greaterThan") {
              const numValue = parseFloat(filter.filter);
              if (!isNaN(numValue)) {
                whereConditions[field] = { gt: numValue };
              }
            } else if (filter.type === "greaterThanOrEqual") {
              const numValue = parseFloat(filter.filter);
              if (!isNaN(numValue)) {
                whereConditions[field] = { gte: numValue };
              }
            } else if (filter.type === "lessThan") {
              const numValue = parseFloat(filter.filter);
              if (!isNaN(numValue)) {
                whereConditions[field] = { lt: numValue };
              }
            } else if (filter.type === "lessThanOrEqual") {
              const numValue = parseFloat(filter.filter);
              if (!isNaN(numValue)) {
                whereConditions[field] = { lte: numValue };
              }
            } else if (filter.type === "inRange") {
              const fromValue = parseFloat(filter.filter);
              const toValue = parseFloat(filter.filterTo);

              if (!isNaN(fromValue) && !isNaN(toValue)) {
                whereConditions[field] = {
                  gte: fromValue,
                  lte: toValue,
                };
              }
            }
          }
        } catch (err) {
          console.error(`Error processing filter for field ${field}:`, err);
          // Continue with other filters
        }
      }

      // Build the final where clause
      if (Object.keys(whereConditions).length > 0 && orConditions.length > 0) {
        // Both regular filters and quick filter
        const andConditions = [];

        // Add each column filter as a separate condition
        for (const [key, value] of Object.entries(whereConditions)) {
          andConditions.push({ [key]: value });
        }

        queryOptions.where = {
          AND: [...andConditions, { OR: orConditions }],
        };
      } else if (Object.keys(whereConditions).length > 0) {
        // Only regular filters - convert object to AND array of conditions
        const andConditions = [];
        for (const [key, value] of Object.entries(whereConditions)) {
          andConditions.push({ [key]: value });
        }

        if (andConditions.length === 1) {
          // Just one condition, no need for AND
          queryOptions.where = andConditions[0];
        } else {
          // Multiple conditions
          queryOptions.where = { AND: andConditions };
        }
      } else if (orConditions.length > 0) {
        // Only quick filter
        queryOptions.where = { OR: orConditions };
      }
    }

    console.log("Query options:", JSON.stringify(queryOptions, null, 2));

    // Get paginated, sorted, and filtered data first
    // to avoid doing the full count when possible
    const students = await db.students.findMany(queryOptions);

    // Only get the total count when needed for last row calculation
    // AG Grid requires the lastRow parameter for proper pagination
    let totalCount;

    // Check if we got fewer rows than requested,
    // which means we've reached the end
    if (students.length < queryOptions.take) {
      // If we have fewer rows than requested, we know the total is startRow + actual rows
      totalCount = startRow + students.length;
    } else {
      // Otherwise, we need to count the total matching rows
      totalCount = await db.students.count({
        where: queryOptions.where,
      });
    }

    return NextResponse.json({
      rows: students,
      lastRow: totalCount,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
