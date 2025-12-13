"use client";

import { OrganizationStructure } from "@/components/OrganizationStructure";
import { RequireRole } from "@/components/require-role";
import { UserRole } from "@/types/auth";

export default function OrganizationPage() {
  return (
    <RequireRole roles={[UserRole.HR, UserRole.Admin]}>
      <OrganizationStructure />
    </RequireRole>
  );
}
