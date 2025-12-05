"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, TrendingUp, CalendarCheck, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { profileApi } from "@/lib/api/profile"
import type { EmployeeProfile } from "@/types/profile"
import { useAuth } from "@/lib/hooks/use-auth"

const upcomingLeaves = [
  { id: 1, type: "Vacation", startDate: "Dec 24, 2023", endDate: "Dec 28, 2023", days: 5, status: "Approved" },
  { id: 2, type: "Sick Leave", startDate: "Nov 15, 2023", endDate: "Nov 15, 2023", days: 1, status: "Pending" },
]

const recentActivities = [
  { id: 1, action: "Leave request submitted", date: "2 hours ago", type: "leave" },
  { id: 2, action: "Timesheet update approved", date: "1 day ago", type: "timesheet" },
  { id: 3, action: "WFH request approved", date: "3 days ago", type: "wfh" },
]

export function DashboardOverview() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await profileApi.getProfile();
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile for dashboard:", err);
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchProfile();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Fallback if profile fails to load
  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : "Employee";
  const position = profile?.position || "Staff";
  const annualLeave = profile?.leaveBalance?.annual ?? 0;
  const sickLeave = profile?.leaveBalance?.sick ?? 0;
  const personalLeave = profile?.leaveBalance?.personal ?? 0;
  const totalBalance = annualLeave + sickLeave + personalLeave;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {profile?.firstName || "there"}!</h1>
          <p className="mt-1 text-slate-600">Here's what's happening with your account today.</p>
        </div>
        <Avatar className="h-16 w-16">
          <AvatarImage src={profile?.avatarUrl || "/professional-portrait.png"} alt={displayName} />
          <AvatarFallback className="bg-blue-600 text-xl text-white">
            {profile ? `${profile.firstName[0]}${profile.lastName[0]}` : "JD"}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Annual Leave</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{annualLeave}</p>
                <p className="mt-1 text-xs text-slate-500">days remaining</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Sick Leave</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{sickLeave}</p>
                <p className="mt-1 text-xs text-slate-500">days remaining</p>
              </div>
              <div className="rounded-full bg-emerald-100 p-3">
                <CalendarCheck className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Requests</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">0</p>
                <p className="mt-1 text-xs text-slate-500">awaiting approval</p>
              </div>
              <div className="rounded-full bg-amber-100 p-3">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Personal Days</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{personalLeave}</p>
                <p className="mt-1 text-xs text-slate-500">days remaining</p>
              </div>
              <div className="rounded-full bg-purple-100 p-3">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Leaves */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upcoming Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{leave.type}</p>
                      <Badge
                        variant="outline"
                        className={
                          leave.status === "Approved"
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }
                      >
                        {leave.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {leave.startDate} - {leave.endDate} ({leave.days} days)
                    </p>
                  </div>
                </div>
              ))}
              <Link href="/leave">
                <Button variant="outline" className="w-full bg-transparent">
                  View All Leaves
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">{activity.action}</p>
                    <p className="text-xs text-slate-500">{activity.date}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full bg-transparent">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
