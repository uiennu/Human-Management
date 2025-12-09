"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, TrendingUp, CalendarCheck, AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { profileApi } from "@/lib/api/profile"
import { useRouter } from "next/navigation"
import type { EmployeeProfile } from "@/types/profile"
import { useAuth } from "@/lib/hooks/use-auth"
import { leaveService } from "@/lib/api/leave-service"
import type { LeaveBalance, LeaveRequestListItem } from "@/types/leave"





export function DashboardOverview() {
  const { token, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [upcomingRequests, setUpcomingRequests] = useState<LeaveRequestListItem[]>([]);

  const [recentRequests, setRecentRequests] = useState<LeaveRequestListItem[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await profileApi.getProfile();
        setProfile(data);
      } catch (err: any) {
        console.error("Error fetching profile for dashboard:", err);
        if (err.message === "UNAUTHORIZED") {
          logout();
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      fetchProfile();

      // Decode token to get EmployeeID
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const id = payload.EmployeeID || payload.employeeID || payload.nameid || payload.sub;

        if (id) {
          setEmployeeId(Number(id));
        }
      } catch (e) {
        console.error("Error decoding token:", e);
      }
    }
  }, [token]);
  useEffect(() => {
    async function fetchLeaveData() {
      if (!employeeId) return;

      try {
        const [balancesData, approvedData, recentData, pendingData] = await Promise.all([
          leaveService.getMyBalances(employeeId),
          leaveService.getMyRequests(employeeId, {
            status: 'Approved',
            page: 1,
            pageSize: 20
          }),
          leaveService.getMyRequests(employeeId, {
            page: 1,
            pageSize: 5
          }),
          leaveService.getMyRequests(employeeId, {
            status: 'Pending',
            page: 1,
            pageSize: 1
          })
        ]);

        setBalances(balancesData || []);

        // Filter for future requests
        const now = new Date();
        const futureRequests = (approvedData.data || []).filter(req => {
          const startDate = new Date(req.startDate);
          return startDate >= now;
        }).slice(0, 3);

        setUpcomingRequests(futureRequests);

        setRecentRequests(recentData.data || []);
        setPendingCount(pendingData.totalItems || 0);
      } catch (err) {
        console.error("Error fetching leave data:", err);
      }
    }

    if (employeeId) {
      fetchLeaveData();
    }
  }, [employeeId]);

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Fallback if profile fails to load
  const displayName = profile ? `${profile.firstName} ${profile.lastName}` : "Employee";

  // Calculate balances from fetched data or fallback to profile
  const getBalance = (type: string) => {
    const balance = balances.find(b => b.name.toLowerCase().includes(type.toLowerCase()));
    return balance ? balance.balanceDays : 0;
  };

  const annualLeave = balances.length > 0 ? getBalance('Annual') : (profile?.leaveBalance?.annual ?? 0);
  const sickLeave = balances.length > 0 ? getBalance('Sick') : (profile?.leaveBalance?.sick ?? 0);
  const personalLeave = balances.length > 0 ? getBalance('Personal') : (profile?.leaveBalance?.personal ?? 0);
  const totalBalance = balances.length > 0 ? balances.reduce((acc, curr) => acc + curr.balanceDays, 0) : (annualLeave + sickLeave + personalLeave);


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
                <p className="mt-2 text-3xl font-bold text-slate-900">{pendingCount}</p>
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
              {upcomingRequests.length > 0 ? (
                upcomingRequests.map((leave) => (
                  <div
                    key={leave.leaveRequestID}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{leave.leaveTypeName}</p>
                        <Badge
                          variant="outline"
                          className="bg-emerald-100 text-emerald-700 border-emerald-200"
                        >
                          {leave.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()} ({leave.totalDays} days)
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No upcoming leaves</p>
              )}
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

              {recentRequests.length > 0 ? (
                recentRequests.map((activity) => (
                  <div key={activity.leaveRequestID} className="flex items-start gap-3">
                    <div className="rounded-full bg-blue-100 p-2">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">
                        Leave request for {activity.leaveTypeName} was {activity.status.toLowerCase()}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(activity.requestedDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No recent activity</p>
              )}
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
