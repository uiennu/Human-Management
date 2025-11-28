import RequireAuth from "@/components/require-auth";
import LeaveHistoryPage from "@/components/leave-history-page";

export default function LeavePage() {
  return (
    <RequireAuth>
      <LeaveHistoryPage />
    </RequireAuth>
  );
}
