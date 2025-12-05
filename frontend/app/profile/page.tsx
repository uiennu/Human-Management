"use client";

import Link from "next/link";
import RequireAuth from "@/components/require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Calendar, Briefcase, Edit, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { profileApi } from "@/lib/api/profile";
import type { EmployeeProfile } from "@/types/profile";
import { useAuth } from "@/lib/hooks/use-auth";

export default function ProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await profileApi.getProfile();
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data");
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
      <RequireAuth>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </RequireAuth>
    );
  }

  if (error || !profile) {
    return (
      <RequireAuth>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-red-500">
          <p>{error || "Profile not found"}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

          <Link href="/profile/edit">
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src="/professional-portrait.png" alt={profile.firstName} />
                  <AvatarFallback className="bg-blue-600 text-3xl text-white">
                    {profile.firstName[0]}{profile.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <h2 className="mt-4 text-2xl font-bold text-slate-900">{profile.firstName} {profile.lastName}</h2>
                <p className="text-slate-600">{profile.position}</p>
                <Badge className="mt-2 bg-blue-600">{profile.department}</Badge>
                <div className="mt-6 w-full space-y-3 text-left">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4" />
                    {profile.phone || "N/A"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4" />
                    {profile.location || "N/A"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Cards */}
          <div className="space-y-6 lg:col-span-2">
            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Employment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Employee ID</p>
                    <p className="mt-1 text-slate-900">{profile.employeeId}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Join Date</p>
                    <div className="mt-1 flex items-center gap-1 text-slate-900">
                      <Calendar className="h-4 w-4" />
                      {new Date(profile.joinDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Department</p>
                    <div className="mt-1 flex items-center gap-1 text-slate-900">
                      <Briefcase className="h-4 w-4" />
                      {profile.department}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Manager</p>
                    <p className="mt-1 text-slate-900">{profile.manager || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Leave Balance */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Balance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-900">Annual Leave</p>
                    <p className="mt-2 text-3xl font-bold text-blue-900">{profile.leaveBalance?.annual ?? 0}</p>
                    <p className="text-xs text-blue-700">days remaining</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-900">Sick Leave</p>
                    <p className="mt-2 text-3xl font-bold text-emerald-900">{profile.leaveBalance?.sick ?? 0}</p>
                    <p className="text-xs text-emerald-700">days remaining</p>
                  </div>
                  <div className="rounded-lg bg-purple-50 p-4">
                    <p className="text-sm font-medium text-purple-900">Personal Days</p>
                    <p className="mt-2 text-3xl font-bold text-purple-900">{profile.leaveBalance?.personal ?? 0}</p>
                    <p className="text-xs text-purple-700">days remaining</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>This Year Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div>
                      <p className="text-sm text-slate-600">Total Leaves Taken</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">0</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div>
                      <p className="text-sm text-slate-600">Pending Requests</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">0</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div>
                      <p className="text-sm text-slate-600">WFH Days</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">0</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                    <div>
                      <p className="text-sm text-slate-600">Overtime Hours</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">0h</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}