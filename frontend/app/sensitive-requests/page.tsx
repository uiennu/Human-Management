import RequireAuth from "@/components/require-auth"
import { RequireRole } from "@/components/require-role"
import SensitiveRequestManagement from "@/components/sensitive-request-management"
import { UserRole } from "@/types/auth"

export default function SensitiveRequestsPage() {
  return (
    <RequireAuth>
      <RequireRole roles={[UserRole.HRManager, UserRole.HREmployee, UserRole.Admin]}>
        <SensitiveRequestManagement />
      </RequireRole>
    </RequireAuth>
  )
}
