"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Eye, X, Plus, TriangleAlert, ChevronDown, ChevronUp, Check } from "lucide-react"
import LeaveRequestForm from "./LeaveRequestForm"
import LeaveRequestDetail from "./LeaveRequestDetail"
import { leaveService } from "@/lib/api/leave-service"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type LeaveStatus = "Approved" | "Pending" | "Rejected" | "Cancelled" | "Draft"

const statusColors: Record<LeaveStatus, string> = {
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Rejected: "bg-rose-100 text-rose-700 border-rose-200",
  Cancelled: "bg-slate-100 text-slate-600 border-slate-200",
  Draft: "bg-gray-100 text-gray-600 border-gray-200",
}

export default function LeaveHistoryPage() {
  const [activeTab, setActiveTab] = useState<"my-request" | "my-approval">("my-request")
  const [showBalanceDropdown, setShowBalanceDropdown] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("last-30-days")
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  // Dialogs
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [viewingRequest, setViewingRequest] = useState<any | null>(null)

  // Data
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [balances, setBalances] = useState<any[]>([])
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])

  // User Info
  const [employeeId, setEmployeeId] = useState<number | null>(null)
  const [userRole, setUserRole] = useState<string>("")

  // Approval Data
  const [approvalRequests, setApprovalRequests] = useState<any[]>([]);
  const [loadingApprovals, setLoadingApprovals] = useState(false);

  // Approval Filters & Stats
  const [approvalStats, setApprovalStats] = useState({ all: 0, pending: 0, complete: 0 })
  const [approvalStatusFilter, setApprovalStatusFilter] = useState<string>("all")
  const [approvalDateRangeFilter, setApprovalDateRangeFilter] = useState<string>("last-30-days")
  const [approvalLeaveTypeFilter, setApprovalLeaveTypeFilter] = useState<string>("all")

  // 1. useEffect: Lấy ID và Role từ Token
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);

        const id = payload.EmployeeID || payload.employeeID || payload.nameid || payload.sub;
        const role = payload.role || payload.Role || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || "";

        if (id) setEmployeeId(Number(id));
        if (role) setUserRole(role);

      } catch (e) {
        console.error("Lỗi khi giải mã token:", e);
      }
    }
  }, []);


  // 2. useEffect: Load My Requests
  useEffect(() => {
    let ignore = false;

    if (employeeId && employeeId > 0 && activeTab === 'my-request') {
      const fetchRequests = async () => {
        setLoading(true);
        try {
          const data = await leaveService.getMyRequests(employeeId, {
            status: statusFilter,
            dateRange: dateRangeFilter,
            leaveTypeId: leaveTypeFilter,
            page: currentPage
          });
          if (!ignore) {
            setRequests(data.data || []);
          }
        } catch (err) {
          if (!ignore) {
            console.error(err);
            setError("Failed to load leave history");
          }
        } finally {
          if (!ignore) {
            setLoading(false);
          }
        }
      };

      fetchRequests();
      loadBalances();
      loadLeaveTypes();
    }

    return () => {
      ignore = true;
    };
  }, [employeeId, statusFilter, dateRangeFilter, leaveTypeFilter, currentPage, activeTab]);

  // --- 3. useEffect MỚI: Load Approvals (ĐÃ SỬA: Chạy ngay khi có ID, không chờ chuyển tab) ---
  useEffect(() => {
    // SỬA: Bỏ điều kiện activeTab === "my-approval" để nó load ngầm luôn
    // Thêm check userRole để chỉ Manager/Admin mới gọi API này cho đỡ tốn tài nguyên
    const isManagerOrAdmin = ["HR Manager", "IT Manager", "Admin", "Sales Manager", "Finance Manager", "BOD Assistant"].includes(userRole);

    if (employeeId && isManagerOrAdmin) {
      const fetchApprovals = async () => {
        setLoadingApprovals(true);
        try {
          const response = await fetch(`http://localhost:8081/api/approvals/pending?managerId=${employeeId}`);

          if (response.ok) {
            const data = await response.json();
            setApprovalRequests(data);
          } else {
            console.error("Failed to fetch approvals");
          }
        } catch (error) {
          console.error("Error fetching approvals:", error);
        } finally {
          setLoadingApprovals(false);
        }
      };

      fetchApprovals();

      // (Tùy chọn) Auto refresh danh sách duyệt mỗi 30s để cập nhật real-time
      const interval = setInterval(fetchApprovals, 30000);
      return () => clearInterval(interval);
    }
  }, [employeeId, userRole]); // Bỏ activeTab ra khỏi dependencies

  // Calculate Approval Stats
  useEffect(() => {
    if (approvalRequests.length > 0) {
      const pending = approvalRequests.filter((r: any) => r.status === 'Pending').length
      const complete = approvalRequests.filter((r: any) => r.status === 'Approved' || r.status === 'Rejected').length

      setApprovalStats({
        all: approvalRequests.length,
        pending,
        complete
      })
    } else {
      setApprovalStats({ all: 0, pending: 0, complete: 0 })
    }
  }, [approvalRequests])

  // Stats logic
  const [stats, setStats] = useState({ all: 0, pending: 0, approved: 0, rejected: 0, draft: 0 })

  useEffect(() => {
    if (employeeId && employeeId > 0) {
      const fetchStats = async () => {
        try {
          const data = await leaveService.getMyRequests(employeeId, {
            status: 'all',
            dateRange: dateRangeFilter,
            leaveTypeId: leaveTypeFilter,
            page: 1,
            pageSize: 1000
          });

          const allReqs = data.data || [];
          setStats({
            all: allReqs.length,
            pending: allReqs.filter((r: any) => r.status === 'Pending').length,
            approved: allReqs.filter((r: any) => r.status === 'Approved').length,
            rejected: allReqs.filter((r: any) => r.status === 'Rejected').length,
            draft: allReqs.filter((r: any) => r.status === 'Draft').length
          })
        } catch (err) {
          console.error("Failed to load stats", err);
        }
      }
      fetchStats();
    }
  }, [employeeId, dateRangeFilter, leaveTypeFilter]);

  const loadLeaveTypes = async () => {
    try {
      const types = await leaveService.getLeaveTypes();
      setLeaveTypes(types);
    } catch (err) {
      console.error("Failed to load leave types", err);
    }
  };

  const loadBalances = async () => {
    if (!employeeId) return;
    try {
      const data = await leaveService.getMyBalances(employeeId);
      setBalances(data || []);
    } catch (err) {
      console.error("Failed to load balances", err);
    }
  };

  const handleCancelRequest = (id: number) => {
    setSelectedRequestId(id)
    setCancelDialogOpen(true)
  }

  const confirmCancel = async () => {
    if (!selectedRequestId) return;
    try {
      await leaveService.cancelLeaveRequest(selectedRequestId);
      window.location.reload();
    } catch (error) {
      console.error("Failed to cancel request", error);
      alert("Failed to cancel request");
    }
  }

  const handleViewDetails = (request: any) => {
    setViewingRequest(request)
  }

  const handleClearFilters = () => {
    setStatusFilter("all")
    setDateRangeFilter("last-30-days")
    setLeaveTypeFilter("all")
    setCurrentPage(1);
  }

  const handleClearApprovalFilters = () => {
    setApprovalStatusFilter("all")
    setApprovalDateRangeFilter("last-30-days")
    setApprovalLeaveTypeFilter("all")
  }

  const handleApprove = (id: number) => {
    alert(`Approving request ${id} (Integrate API later)`);
  }

  const handleReject = (id: number) => {
    alert(`Rejecting request ${id} (Integrate API later)`);
  }

  // Filter approval requests
  const filteredApprovalRequests = approvalRequests.filter((req: any) => {
    // Status filter
    if (approvalStatusFilter === 'Pending' && req.status !== 'Pending') return false
    if (approvalStatusFilter === 'Complete' && req.status !== 'Approved' && req.status !== 'Rejected') return false

    // Leave type filter
    if (approvalLeaveTypeFilter !== 'all' && req.leaveTypeID?.toString() !== approvalLeaveTypeFilter) return false

    // Date range filter (based on requestedDate)
    if (approvalDateRangeFilter !== 'all-time') {
      const requestDate = new Date(req.requestedDate)
      const now = new Date()
      const daysDiff = Math.floor((now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24))

      if (approvalDateRangeFilter === 'last-7-days' && daysDiff > 7) return false
      if (approvalDateRangeFilter === 'last-30-days' && daysDiff > 30) return false
      if (approvalDateRangeFilter === 'last-90-days' && daysDiff > 90) return false
      if (approvalDateRangeFilter === 'this-year') {
        if (requestDate.getFullYear() !== now.getFullYear()) return false
      }
    }

    return true
  })

  if (viewingRequest) {
    return (
      <LeaveRequestDetail
        request={viewingRequest}
        isManagerView={activeTab === "my-approval"}
        onBack={() => setViewingRequest(null)}
      />
    )
  }

  if (showCreateForm) {
    return (
      <LeaveRequestForm
        employeeId={employeeId}
        onCancel={() => setShowCreateForm(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Leave Management</h1>
            <p className="mt-0.5 text-sm text-slate-600">View and manage your leave requests</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Leave Request
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("my-request")}
            className={`px-4 py-2 font-semibold text-sm transition-colors relative ${activeTab === "my-request"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-slate-600 hover:text-slate-900"
              }`}
          >
            My Request
          </button>

          {(userRole === "HR Manager" || userRole === "IT Manager" || userRole === "Admin" || userRole === "Sales Manager" || userRole === "Finance Manager" || userRole === "BOD Assistant") && (
            <button
              onClick={() => setActiveTab("my-approval")}
              className={`px-4 py-2 font-semibold text-sm transition-colors relative ${activeTab === "my-approval"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-600 hover:text-slate-900"
                }`}
            >
              My Approval
              {approvalRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-in fade-in zoom-in duration-300">
                  {approvalRequests.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* CONTENT: MY REQUEST TAB */}
        {activeTab === "my-request" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Card className={`cursor-pointer hover:shadow-lg transition-all ${statusFilter === "all" ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50" : ""}`} onClick={() => setStatusFilter("all")}>
                <CardContent className="!px-3 !py-2">
                  <p className="text-sm font-medium text-slate-600">All my request</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.all}</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer hover:shadow-lg transition-all ${statusFilter === "Pending" ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50" : ""}`} onClick={() => setStatusFilter("Pending")}>
                <CardContent className="!px-3 !py-2">
                  <p className="text-sm font-medium text-amber-600">Pending request</p>
                  <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer hover:shadow-lg transition-all ${statusFilter === "Approved" ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50" : ""}`} onClick={() => setStatusFilter("Approved")}>
                <CardContent className="!px-3 !py-2">
                  <p className="text-sm font-medium text-emerald-600">Approved Request</p>
                  <p className="text-2xl font-bold text-emerald-700">{stats.approved}</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer hover:shadow-lg transition-all ${statusFilter === "Rejected" ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50" : ""}`} onClick={() => setStatusFilter("Rejected")}>
                <CardContent className="!px-3 !py-2">
                  <p className="text-sm font-medium text-rose-600">Declined Request</p>
                  <p className="text-2xl font-bold text-rose-700">{stats.rejected}</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer hover:shadow-lg transition-all ${statusFilter === "Draft" ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50" : ""}`} onClick={() => setStatusFilter("Draft")}>
                <CardContent className="!px-3 !py-2">
                  <p className="text-sm font-medium text-gray-600">Draft Request</p>
                  <p className="text-2xl font-bold text-gray-700">{stats.draft}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardContent className="p-3">
                <button
                  onClick={() => setShowBalanceDropdown(!showBalanceDropdown)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h2 className="text-sm font-semibold text-slate-900">My Balance</h2>
                  {showBalanceDropdown ? <ChevronUp className="h-5 w-5 text-slate-600" /> : <ChevronDown className="h-5 w-5 text-slate-600" />}
                </button>
                {showBalanceDropdown && (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {balances.length > 0 ? (
                      balances.map((balance) => (
                        <Card key={balance.leaveTypeID} className="bg-slate-50 border-slate-200">
                          <CardContent className="flex items-center justify-between p-4">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave Type</span>
                              <p className="text-sm font-bold text-slate-900 mt-1">{balance.name || balance.Name || 'Unknown'}</p>
                            </div>
                            <div className="text-right">
                              <span className="text-5xl font-extrabold text-blue-600 block leading-none">{balance.balanceDays}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Available</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : <p className="text-sm text-slate-500 col-span-full">No balance information available</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <h2 className="mb-2 text-xs font-semibold text-slate-900">Filter by</h2>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-slate-50 cursor-pointer"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Date Range</label>
                    <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                      <SelectTrigger className="bg-slate-50 cursor-pointer"><SelectValue placeholder="Last 30 Days" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                        <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                        <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                        <SelectItem value="this-year">This Year</SelectItem>
                        <SelectItem value="all-time">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Leave Type</label>
                    <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                      <SelectTrigger className="bg-slate-50 cursor-pointer"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {leaveTypes.map(type => (
                          <SelectItem key={type.leaveTypeID} value={type.leaveTypeID.toString()}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleClearFilters} variant="outline" className="cursor-pointer">Clear Filters</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Request History</h2>
                {loading ? <p className="text-center py-4">Loading...</p> : error ? <p className="text-center py-4 text-red-500">{error}</p> : requests.length === 0 ? <p className="text-center py-4 text-gray-500">No leave requests found.</p> : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Leave Type</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Dates</th>
                          <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">Total Days</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Submitted Date</th>
                          <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {requests.map((request) => (
                          <tr key={request.leaveRequestID} className="hover:bg-slate-50 cursor-pointer" onClick={() => handleViewDetails(request)}>
                            <td className="py-2 text-sm text-slate-900">{request.leaveTypeName || 'Unknown'}</td>
                            <td className="py-2 text-sm text-slate-600">
                              {new Date(request.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} -
                              {new Date(request.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </td>
                            <td className="py-2 text-center text-sm text-slate-900">{request.totalDays}</td>
                            <td className="py-2">
                              <Badge variant="outline" className={`${statusColors[request.status as LeaveStatus] || 'bg-gray-100'} font-medium`}>{request.status}</Badge>
                            </td>
                            <td className="py-2 text-sm text-slate-600">{new Date(request.requestedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                            <td className="py-2 text-center">
                              {request.status === "Pending" && (
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 cursor-pointer"
                                  onClick={(e) => { e.stopPropagation(); handleCancelRequest(request.leaveRequestID); }}>
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* CONTENT: MY APPROVAL TAB */}
        {activeTab === "my-approval" && (
          <>
            {/* Status Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className={`cursor-pointer hover:shadow-lg transition-all ${approvalStatusFilter === "all" ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50" : ""}`} onClick={() => setApprovalStatusFilter("all")}>
                <CardContent className="!px-3 !py-2">
                  <p className="text-sm font-medium text-slate-600">All Requests</p>
                  <p className="text-2xl font-bold text-slate-900">{approvalStats.all}</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer hover:shadow-lg transition-all ${approvalStatusFilter === "Pending" ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50" : ""}`} onClick={() => setApprovalStatusFilter("Pending")}>
                <CardContent className="!px-3 !py-2">
                  <p className="text-sm font-medium text-amber-600">Pending Requests</p>
                  <p className="text-2xl font-bold text-amber-700">{approvalStats.pending}</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer hover:shadow-lg transition-all ${approvalStatusFilter === "Complete" ? "ring-2 ring-blue-500 border-blue-500 bg-blue-50" : ""}`} onClick={() => setApprovalStatusFilter("Complete")}>
                <CardContent className="!px-3 !py-2">
                  <p className="text-sm font-medium text-blue-600">Complete Requests</p>
                  <p className="text-2xl font-bold text-blue-700">{approvalStats.complete}</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters Section */}
            <Card>
              <CardContent className="p-3">
                <h2 className="mb-2 text-xs font-semibold text-slate-900">Filter by</h2>
                <div className="flex flex-wrap items-end gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                    <Select value={approvalStatusFilter} onValueChange={setApprovalStatusFilter}>
                      <SelectTrigger className="bg-slate-50 cursor-pointer"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Complete">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Date Range</label>
                    <Select value={approvalDateRangeFilter} onValueChange={setApprovalDateRangeFilter}>
                      <SelectTrigger className="bg-slate-50 cursor-pointer"><SelectValue placeholder="Last 30 Days" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                        <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                        <SelectItem value="last-90-days">Last 90 Days</SelectItem>
                        <SelectItem value="this-year">This Year</SelectItem>
                        <SelectItem value="all-time">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="mb-2 block text-sm font-medium text-slate-700">Leave Type</label>
                    <Select value={approvalLeaveTypeFilter} onValueChange={setApprovalLeaveTypeFilter}>
                      <SelectTrigger className="bg-slate-50 cursor-pointer"><SelectValue placeholder="All" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {leaveTypes.map(type => (
                          <SelectItem key={type.leaveTypeID} value={type.leaveTypeID.toString()}>{type.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleClearApprovalFilters} variant="outline" className="cursor-pointer">Clear Filters</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Approval Requests Table */}
            <Card>
              <CardContent className="p-3">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Approval Requests</h2>
                {loadingApprovals ? (
                  <p className="text-center py-8 text-gray-500">Loading requests...</p>
                ) : filteredApprovalRequests.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No requests found matching your filters.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Employee</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Leave Type</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Created Date</th>
                          <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredApprovalRequests.map((req: any) => (
                          <tr
                            key={req.leaveRequestID}
                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                            onClick={() => handleViewDetails(req)}
                          >
                            <td className="py-2">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden border border-blue-200">
                                  {req.avatarUrl ? (
                                    <img src={req.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-bold text-blue-600">
                                      {req.employeeName ? req.employeeName.charAt(0) : 'U'}
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-slate-900">{req.employeeName || 'Unknown'}</span>
                              </div>
                            </td>
                            <td className="py-2 text-sm text-slate-900">{req.leaveTypeName}</td>
                            <td className="py-2 text-sm text-slate-600">
                              {new Date(req.requestedDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                              })}
                            </td>
                            <td className="py-2">
                              <Badge variant="outline" className={`${statusColors[req.status as LeaveStatus] || 'bg-gray-100'} font-medium`}>
                                {req.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="flex max-w-md flex-col items-center justify-center rounded-xl bg-white p-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D32F2F]/10 p-3"><TriangleAlert className="h-10 w-10 text-[#D32F2F]" /></div>
          <AlertDialogTitle className="mb-2 text-xl font-bold text-[#333333] sm:text-2xl">Confirm Cancellation</AlertDialogTitle>
          <AlertDialogDescription className="mb-6 text-center text-gray-600">Are you sure you want to cancel this leave request? This action cannot be undone.</AlertDialogDescription>
          <div className="flex w-full justify-center gap-3 sm:flex-row">
            <button onClick={confirmCancel} className="flex h-10 min-w-[84px] max-w-[480px] flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#D32F2F] px-4 text-sm font-bold leading-normal tracking-[0.015em] text-white transition-colors hover:bg-red-700"><span className="truncate">Yes, Cancel</span></button>
            <button onClick={() => setCancelDialogOpen(false)} className="flex h-10 min-w-[84px] max-w-[480px] flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-200 px-4 text-sm font-bold leading-normal tracking-[0.015em] text-[#333333] transition-colors hover:bg-gray-300"><span className="truncate">No, Keep It</span></button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  )
}