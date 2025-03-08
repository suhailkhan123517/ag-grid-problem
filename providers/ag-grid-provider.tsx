"use client";

import { useEffect } from "react";
import { LicenseManager } from "ag-grid-enterprise";

export default function AgGridProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const licenseKey = process.env.NEXT_PUBLIC_AG_GRID_KEY;

    if (!licenseKey) {
      console.error(
        "AG Grid license key is missing. Please set NEXT_PUBLIC_AG_GRID_KEY."
      );
    } else {
      LicenseManager.setLicenseKey(licenseKey);
    }
  }, []);

  return <>{children}</>;
}
