"use client";

import { EmployeeProfileReport } from "@/components/employee-profile-report";
import { RequireRole } from "@/components/require-role";
import { UserRole } from "@/types/auth";

export default function ReportsPage() {
  return (
    <RequireRole roles={[UserRole.HRManager, UserRole.Admin, UserRole.ITManager]}>
      <EmployeeProfileReport />
    </RequireRole>
  );
}
