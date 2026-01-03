"use client"

import { Calendar, Clock, FileText, Home, User, LogOut, CalendarClock, Wifi, Users, UserPlus, History, Shield } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/hooks/use-auth"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { profileApi } from "@/lib/api/profile"
import type { EmployeeProfile } from "@/types/profile"
import { UserRole } from "@/types/auth"

const baseNavigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Leave Requests", href: "/leave", icon: CalendarClock },
  { name: "Organization Management", href: "/organization", icon: FileText },
  { name: "Timesheet Updates", href: "/timesheet", icon: FileText },
  { name: "Check-In/Out Requests", href: "/checkin", icon: Clock },
  { name: "Work From Home", href: "/wfh", icon: Wifi },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "My Profile", href: "/profile", icon: User },
];

export function AppSidebar() {
  const pathname = usePathname()
  const { logout, token, roles, hasAnyRole } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  
  // State lưu số lượng pending
  const [pendingCount, setPendingCount] = useState(0);

  // --- LOGIC FETCH SỐ LƯỢNG (Đã sửa lại phần lấy Role) ---
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) return;

    try {
      // 1. Giải mã token
      const base64Url = storedToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const payload = JSON.parse(jsonPayload);
      
      // 2. Lấy ID (Thử mọi trường hợp)
      const empId = payload.EmployeeID || payload.employeeID || payload.nameid || payload.sub || payload.Id || payload.id;
      
      // 3. Lấy Role (SỬA LỖI TẠI ĐÂY: Thêm trường hợp role dài loằng ngoằng của .NET)
      let rawRole = payload.role || payload.Role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";
      
      // Chuyển về mảng string để dễ xử lý
      let userRoles: string[] = [];
      if (Array.isArray(rawRole)) userRoles = rawRole;
      else if (typeof rawRole === 'string') userRoles = [rawRole];

      // 4. Check quyền: Chỉ Manager hoặc Admin mới cần fetch số này
      const isManagerOrAdmin = userRoles.some(r => /Manager|Admin|Assistant/i.test(r));

      if (empId && isManagerOrAdmin) {
         const fetchPendingCount = async () => {
            try {
               const res = await fetch(`http://localhost:8081/api/approvals/pending?managerId=${empId}`);
               if (res.ok) {
                 const data = await res.json();
                 setPendingCount(data.length);
               }
            } catch(e) { 
                console.error("Sidebar fetch error:", e); 
            }
         };
         
         fetchPendingCount();
         
         // Auto refresh mỗi 30 giây
         const interval = setInterval(fetchPendingCount, 30000);
         return () => clearInterval(interval);
      }
    } catch (e) { 
        console.error("Sidebar token parse error:", e); 
    }
  }, []); 


  // Fetch Profile (Logic cũ)
  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await profileApi.getProfile();
        setProfile(data);
      } catch (err: any) {
        if (err.message === "UNAUTHORIZED") {
          logout();
          router.replace("/login");
        }
      }
    }
    if (token) fetchProfile();
  }, [token]);

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : "User";
  const displayPosition = profile?.position || "Employee";

  // Logic hiển thị menu
  const isHROrAdmin = hasAnyRole([UserRole.HRManager, UserRole.Admin, UserRole.HREmployee]);
  const isAdmin = hasAnyRole([UserRole.Admin]);
  const isManager = hasAnyRole([UserRole.ITManager, UserRole.SalesManager, UserRole.FinanceManager, UserRole.BODAssistant]);

  let navigation = baseNavigation;

  if (isHROrAdmin) {
    navigation = [
      ...baseNavigation.slice(0, 1),
      { name: "Reports", href: "/reports", icon: FileText },
      ...baseNavigation.slice(1, 3),
      { name: "Team Management", href: "/organization/teams", icon: Users },
      { name: "Register Employee", href: "/organization/employees/register", icon: UserPlus },
      { name: "Sensitive Requests", href: "/sensitive-requests", icon: Shield },
      ...(isAdmin ? [{ name: "Registration History", href: "/organization/employees/registration-history", icon: History }] : []),
      ...baseNavigation.slice(3)
    ];
  } else if (isManager) {
    navigation = [
      ...baseNavigation.slice(0, 1),
      { name: "Reports", href: "/reports", icon: FileText },
      ...baseNavigation.slice(1, 3),
      ...baseNavigation.slice(3)
    ];
  }

  return (
    <div className="flex h-full w-64 flex-col bg-slate-900 text-slate-100">
      {/* Logo & App Name */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
          <CalendarClock className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">LeaveFlow</h1>
          <p className="text-xs text-slate-400">Employee Portal</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative group", 
                isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              
              <span className="flex-1 truncate">{item.name}</span>

              {/* LOGIC HIỂN THỊ BADGE */}
              {item.name === "Leave Requests" && pendingCount > 0 && (
                <div className="ml-auto shrink-0 pl-2">
                    <Badge 
                    variant="destructive" 
                    className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-red-600 border-0"
                    >
                    {pendingCount}
                    </Badge>
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-slate-800" />

      {/* User Profile Section */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-800 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={profile?.avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-blue-600 text-white">
              {profile ? `${profile.firstName[0]}${profile.lastName[0]}` : "JD"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="truncate text-xs text-slate-400">{displayPosition}</p>
          </div>
        </div>
        
        {roles.length > 0 && (
          <div className="mt-3">
            <label className="block text-xs text-slate-400 mb-1">Your Roles</label>
            <div className="flex flex-wrap gap-1">
              {roles.map((role) => (
                <Badge key={role} variant="secondary" className="text-xs bg-blue-600/20 text-blue-300 border-blue-500/30">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          className="mt-2 w-full justify-start text-slate-300 hover:bg-slate-800 hover:text-white"
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}