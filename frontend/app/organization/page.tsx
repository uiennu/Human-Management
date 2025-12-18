"use client";

import { OrganizationStructure } from "@/components/OrganizationStructure";
import { RequireRole } from "@/components/require-role";
import { UserRole } from "@/types/auth";
import { User } from "lucide-react";

export default function OrganizationPage() {
  return (
    <RequireRole roles={[UserRole.HRManager, UserRole.Admin, UserRole.HREmployee,UserRole.ITManager,UserRole.ITEmployee, UserRole.FinanceManager,UserRole.FinanceEmployee, UserRole.SalesManager,UserRole.SalesEmployee, UserRole.BODAssistant]}>
      <OrganizationStructure />
    </RequireRole>
  );
}
