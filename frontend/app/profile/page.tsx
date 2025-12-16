"use client";

import Link from "next/link";
import RequireAuth from "@/components/require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
// Thêm BarChart3 vào import
import { Mail, Phone, MapPin, Calendar, Briefcase, Edit, Loader2, Fingerprint, CreditCard, Eye, EyeOff, Users, User, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { profileApi } from "@/lib/api/profile";
import type { EmployeeProfile } from "@/types/profile";
import { useAuth } from "@/lib/hooks/use-auth";
import { leaveService } from "@/lib/api/leave-service";
import type { LeaveBalance } from "@/types/leave";

// --- CẤU HÌNH URL ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5204';

export default function ProfilePage() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- STATE RIÊNG CHO TỪNG Ô THÔNG TIN NHẠY CẢM ---
  const [showId, setShowId] = useState(false);
  const [showBank, setShowBank] = useState(false);

  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalLeavesTaken, setTotalLeavesTaken] = useState(0);

  // --- HÀM XỬ LÝ URL ẢNH ---
  const getFullImageUrl = (url: string | null | undefined) => {
    if (!url) return undefined;
    if (url.startsWith('http')) return url; 
    return `${API_BASE_URL}${url}`; 
  };

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
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        const id = payload.EmployeeID || payload.employeeID || payload.nameid || payload.sub;
        if (id) setEmployeeId(Number(id));
      } catch (e) { console.error(e); }
    }
  }, [token]);

  useEffect(() => {
    async function fetchLeaveData() {
      if (!employeeId) return;
      try {
        const [balancesData, approvedData, pendingData] = await Promise.all([
          leaveService.getMyBalances(employeeId),
          leaveService.getMyRequests(employeeId, { status: 'Approved', dateRange: 'this-year', page: 1, pageSize: 1000 }),
          leaveService.getMyRequests(employeeId, { status: 'Pending', page: 1, pageSize: 1 })
        ]);
        setBalances(balancesData || []);
        const totalTaken = (approvedData.data || []).reduce((acc, curr) => acc + curr.totalDays, 0);
        setTotalLeavesTaken(totalTaken);
        setPendingCount(pendingData.totalItems || 0);
      } catch (err) { console.error(err); }
    }
    if (employeeId) fetchLeaveData();
  }, [employeeId]);

  if (loading) return <RequireAuth><div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div></RequireAuth>;
  if (error || !profile) return <RequireAuth><div className="flex h-[50vh] items-center justify-center text-red-500">{error || "Profile not found"}</div></RequireAuth>;

  const getBalance = (type: string) => {
    if (!balances || balances.length === 0) return 0;
    const balance = balances.find(b => b.name.toLowerCase().includes(type.toLowerCase()));
    return balance ? balance.balanceDays : 0;
  };

  const renderData = (value: string | null | undefined, isVisible: boolean) => {
    if (!value) return "Not provided";
    return isVisible ? value : "••••••••••••••••";
  };

  // @ts-ignore
  const emergencyContacts = Array.isArray(profile.basicInfo?.emergencyContacts) 
      // @ts-ignore
      ? profile.basicInfo.emergencyContacts 
      // @ts-ignore
      : (profile.basicInfo?.emergencyContact ? [profile.basicInfo.emergencyContact] : []);

  return (
    <RequireAuth>
      <div className="space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
          <div className="flex gap-2">
            <Link href="/profile/history">
              <Button variant="outline"><BarChart3 className="mr-2 h-4 w-4" /> View History</Button>
            </Link>
            <Link href="/profile/edit">
              <Button variant="outline"><Edit className="mr-2 h-4 w-4" /> Edit Profile</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* CỘT TRÁI: AVATAR & INFO CƠ BẢN */}
          <Card className="lg:col-span-1 h-fit">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage 
                        src={getFullImageUrl(profile.avatarUrl)} 
                        alt={profile.firstName} 
                        className="object-cover"
                    />
                    <AvatarFallback className="bg-blue-600 text-3xl text-white">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </AvatarFallback>
                </Avatar>

                <h2 className="mt-4 text-2xl font-bold text-slate-900">{profile.firstName} {profile.lastName}</h2>
                <p className="text-slate-600">{profile.position}</p>
                <Badge className="mt-2 bg-blue-600">{profile.department}</Badge>
                
                <div className="mt-6 w-full space-y-3 text-left">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="truncate" title={profile.email}>{profile.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="h-4 w-4 text-blue-600" />
                      {profile.phone || "N/A"}
                  </div>
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <span>{profile.location || "N/A"}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CỘT PHẢI: CHI TIẾT */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* 1. PERSONAL & EMPLOYMENT INFORMATION */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <CardTitle>Personal & Employment Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-x-4 gap-y-6 sm:grid-cols-2">
                  
                  {/* Cột 1 */}
                  <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Employee ID</p>
                        <p className="mt-1 text-slate-900 font-semibold">{profile.employeeId}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-slate-500">Department</p>
                        <div className="mt-1 flex items-center gap-2 text-slate-900">
                          <Briefcase className="h-4 w-4 text-slate-400" />
                          {profile.department}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-500">Personal Email</p>
                        <div className="mt-1 flex items-center gap-2 text-slate-900">
                          <Mail className="h-4 w-4 text-slate-400" />
                          {profile.basicInfo?.personalEmail || "N/A"}
                        </div>
                      </div>
                  </div>

                  {/* Cột 2 */}
                  <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-slate-500">Join Date</p>
                        <div className="mt-1 flex items-center gap-2 text-slate-900">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          {new Date(profile.joinDate).toLocaleDateString()}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-500">Manager</p>
                        <div className="mt-1 flex items-center gap-2 text-slate-900">
                           <User className="h-4 w-4 text-slate-400" />
                           {profile.manager || "N/A"}
                        </div>
                      </div>
                  </div>

                  {/* SENSITIVE DATA SECTION */}
                  <div className="col-span-1 sm:col-span-2 border-t pt-4 mt-2 grid sm:grid-cols-2 gap-4">
                      
                      {/* KHUNG HIỂN THỊ ID/CCCD */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
                          <div className="flex items-center gap-2 mb-1">
                              <Fingerprint className="h-4 w-4 text-orange-600" />
                              <p className="text-xs font-bold text-slate-500 uppercase">ID / CCCD</p>
                          </div>
                          <div className="flex items-center justify-between">
                              <p className={`font-mono text-sm ${showId ? "text-slate-900" : "text-slate-400"}`}>
                                  {renderData(profile.sensitiveInfo?.idNumber, showId)}
                              </p>
                              <button 
                                  onClick={() => setShowId(!showId)} 
                                  className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
                                  title={showId ? "Hide ID" : "Show ID"}
                              >
                                  {showId ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                              </button>
                          </div>
                      </div>

                      {/* KHUNG HIỂN THỊ BANK ACCOUNT */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
                          <div className="flex items-center gap-2 mb-1">
                              <CreditCard className="h-4 w-4 text-orange-600" />
                              <p className="text-xs font-bold text-slate-500 uppercase">Bank Account</p>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                              <p className={`font-mono text-sm truncate ${showBank ? "text-slate-900" : "text-slate-400"}`}>
                                  {renderData(profile.sensitiveInfo?.bankAccount, showBank)}
                              </p>
                              <button 
                                  onClick={() => setShowBank(!showBank)} 
                                  className="p-1 hover:bg-slate-200 rounded-full transition-colors text-slate-500 shrink-0"
                                  title={showBank ? "Hide Bank Info" : "Show Bank Info"}
                              >
                                  {showBank ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                              </button>
                          </div>
                      </div>
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* 2. EMERGENCY CONTACTS */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <CardTitle>Emergency Contacts</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {emergencyContacts.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {emergencyContacts.map((contact: any, index: number) => (
                            <div key={index} className="flex flex-col p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <span className="font-semibold text-slate-900">{contact.name}</span>
                                    <Badge variant="outline" className="text-xs font-normal text-slate-500 bg-white">
                                        {contact.relation}
                                    </Badge>
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                    <Phone className="h-3 w-3" />
                                    {contact.phone}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 italic">No emergency contacts listed.</p>
                )}
              </CardContent>
            </Card>

            {/* 3. STATISTICS */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <CardTitle>This Year Statistics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                 <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 border rounded-lg bg-white shadow-sm">
                        <p className="text-sm text-slate-500 mb-1">Total Leaves Taken</p>
                        <p className="text-2xl font-bold text-slate-900">{totalLeavesTaken} <span className="text-sm font-normal text-slate-400">days</span></p>
                    </div>
                    <div className="p-4 border rounded-lg bg-white shadow-sm">
                        <p className="text-sm text-slate-500 mb-1">Pending Requests</p>
                        <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-white shadow-sm">
                        <p className="text-sm text-slate-500 mb-1">WFH Days</p>
                        <p className="text-2xl font-bold text-slate-900">0</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-white shadow-sm">
                        <p className="text-sm text-slate-500 mb-1">Overtime Hours</p>
                        <p className="text-2xl font-bold text-slate-900">0h</p>
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