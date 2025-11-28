"use client"

import { Calendar, Clock, FileText, Home, User, LogOut, CalendarClock, Wifi } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Leave Requests", href: "/leave", icon: Calendar },
  { name: "Timesheet Updates", href: "/timesheet", icon: FileText },
  { name: "Check-In/Out Requests", href: "/checkin", icon: Clock },
  { name: "Work From Home", href: "/wfh", icon: Wifi },
  { name: "My Profile", href: "/profile", icon: User },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

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
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-slate-800" />

      {/* User Profile Section */}
      <div className="p-4">
        <div className="flex items-center gap-3 rounded-lg bg-slate-800 p-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/professional-portrait.png" alt="User" />
            <AvatarFallback className="bg-blue-600 text-white">JD</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-white">John Doe</p>
            <p className="truncate text-xs text-slate-400">Software Engineer</p>
          </div>
        </div>
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
