

import RequireAuth from "@/components/require-auth";
import { DashboardOverview } from "@/components/dashboard-overview";

export default function Home() {
  return (
    <RequireAuth>
      <DashboardOverview />
    </RequireAuth>
  );
}
