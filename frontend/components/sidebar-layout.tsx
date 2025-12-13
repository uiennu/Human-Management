"use client";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/login") {
    return <>{children}</>;
  }
  const isOrgPage = pathname === "/organization";

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className={`flex-1 bg-slate-50 ${isOrgPage ? "overflow-hidden" : "overflow-y-auto"}`}>
        <div className={isOrgPage ? "h-full w-full" : "mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"}>
          {children}
        </div>
      </main>
    </div>
  );
}
