"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Eye, X, Plus, TriangleAlert } from "lucide-react"
import LeaveRequestForm from "./LeaveRequestForm"
import LeaveRequestDetail from "./LeaveRequestDetail"
import { leaveService } from "@/lib/services/leaveService"
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
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("last-30-days")
  const [leaveTypeFilter, setLeaveTypeFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [viewingRequest, setViewingRequest] = useState<any | null>(null)

  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [balances, setBalances] = useState<any[]>([])
  const [leaveTypes, setLeaveTypes] = useState<any[]>([])

  const [employeeId, setEmployeeId] = useState<number | null>(null);


  // 2. useEffect: Lấy ID từ Token (thay vì lấy từ user object bị null)
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // --- ĐOẠN CODE GIẢI MÃ JWT TOKEN ---
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        console.log("Token Payload đã giải mã:", payload); 

        // Dựa vào log của bạn, key trong token là "EmployeeID"
        // (Lưu ý chữ hoa chữ thường tùy server, nên mình check vài trường hợp)
        const id = payload.EmployeeID || payload.employeeID || payload.nameid || payload.sub;

        if (id) {
            console.log("Đã tìm thấy ID từ Token:", id);
            setEmployeeId(Number(id));
        } else {
            console.error("Không tìm thấy EmployeeID trong token");
        }
      } catch (e) {
        console.error("Lỗi khi giải mã token:", e);
      }
    } else {
        console.log("Không tìm thấy token trong localStorage");
    }
  }, []);

  useEffect(() => {
    if (employeeId && employeeId > 0) {
        loadRequests();
        loadBalances();
        loadLeaveTypes();
    }
  }, [showCreateForm, employeeId]);

  const loadLeaveTypes = async () => {
    try {
      const types = await leaveService.getLeaveTypes();
      setLeaveTypes(types);
    } catch (err) {
      console.error("Failed to load leave types", err);
    }
  };

  const loadRequests = async () => {
    // --- THÊM ĐOẠN NÀY ĐỂ CHẶN LỖI ---
    if (!employeeId || employeeId === 0) {
        console.log("🛑 Đang chờ ID... (Chưa gọi API)");
        return; // Dừng ngay lập tức, không cho chạy tiếp
    }
    // ----------------------------------

    setLoading(true);
    try {
      console.log("✅ Bắt đầu gọi API với ID:", employeeId);
      const data = await leaveService.getMyRequests(employeeId, {
        status: statusFilter,
        dateRange: dateRangeFilter,
        leaveTypeId: leaveTypeFilter,
        page: currentPage
      });
      setRequests(data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load leave history");
    } finally {
      setLoading(false);
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

  const getTotalBalance = () => {
    return balances.reduce((acc, curr) => acc + curr.balanceDays, 0);
  };

  const getUsedDays = () => {
    return requests
      .filter(r => r.status === 'Approved')
      .reduce((acc, curr) => acc + curr.totalDays, 0);
  };

  const handleCancelRequest = (id: number) => {
    setSelectedRequestId(id)
    setCancelDialogOpen(true)
  }

  const confirmCancel = async () => {
    if (!selectedRequestId) return;
    try {
      await leaveService.cancelLeaveRequest(selectedRequestId);
      loadRequests();
      setCancelDialogOpen(false);
      setSelectedRequestId(null);
    } catch (error) {
      console.error("Failed to cancel request", error);
      alert("Failed to cancel request");
    }
  }

  const handleViewDetails = (request: any) => {
    setViewingRequest(request)
  }

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadRequests();
  }

  const handleClearFilters = () => {
    setStatusFilter("all")
    setDateRangeFilter("last-30-days")
    setLeaveTypeFilter("all")
    // Use timeout to allow state update to propagate before reloading
    // In a real app, we'd pass the default values directly to loadRequests or use useEffect on filters
    setTimeout(() => {
      // Manually call loadRequests with default values since state might not be updated yet in this closure
      setLoading(true);
      leaveService.getMyRequests(employeeId||0, {
        status: "all",
        dateRange: "last-30-days",
        leaveTypeId: "all",
        page: 1
      }).then(data => {
        setRequests(data.data || []);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    }, 0);
  }

  if (viewingRequest) {
    return (
      <LeaveRequestDetail
        request={viewingRequest}
        onBack={() => setViewingRequest(null)}
      />
    )
  }

  if (showCreateForm) {
    return (
      <LeaveRequestForm
        onCancel={() => setShowCreateForm(false)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 space-y-6">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Leave Management</h1>
            <p className="mt-1 text-slate-600">View and manage your leave requests</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 cursor-pointer"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Leave Request
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600">Total Balance</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{getTotalBalance()} Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600">Approved Used</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{getUsedDays()} Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600">Pending Requests</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {requests.filter(r => r.status === 'Pending').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Filter by</h2>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-slate-50 cursor-pointer">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">All</SelectItem>
                    <SelectItem value="Approved" className="cursor-pointer">Approved</SelectItem>
                    <SelectItem value="Pending" className="cursor-pointer">Pending</SelectItem>
                    <SelectItem value="Rejected" className="cursor-pointer">Rejected</SelectItem>
                    <SelectItem value="Cancelled" className="cursor-pointer">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="mb-2 block text-sm font-medium text-slate-700">Date Range</label>
                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="bg-slate-50 cursor-pointer">
                    <SelectValue placeholder="Last 30 Days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last-7-days" className="cursor-pointer">Last 7 Days</SelectItem>
                    <SelectItem value="last-30-days" className="cursor-pointer">Last 30 Days</SelectItem>
                    <SelectItem value="last-90-days" className="cursor-pointer">Last 90 Days</SelectItem>
                    <SelectItem value="this-year" className="cursor-pointer">This Year</SelectItem>
                    <SelectItem value="all-time" className="cursor-pointer">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="mb-2 block text-sm font-medium text-slate-700">Leave Type</label>
                <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
                  <SelectTrigger className="bg-slate-50 cursor-pointer">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">All</SelectItem>
                    {leaveTypes.map(type => (
                      <SelectItem key={type.leaveTypeID} value={type.leaveTypeID.toString()} className="cursor-pointer">
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleApplyFilters} className="bg-blue-600 hover:bg-blue-700 cursor-pointer">
                  Apply Filters
                </Button>
                <Button onClick={handleClearFilters} variant="outline" className="cursor-pointer">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Request History Table */}
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-6 text-lg font-semibold text-slate-900">Request History</h2>

            {loading ? (
              <p className="text-center py-4">Loading...</p>
            ) : error ? (
              <p className="text-center py-4 text-red-500">{error}</p>
            ) : requests.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No leave requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Leave Type
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Dates
                      </th>
                      <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Total Days
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Status
                      </th>
                      <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Submitted Date
                      </th>
                      <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {requests.map((request) => (
                      <tr key={request.leaveRequestID} className="hover:bg-slate-50">
                        <td className="py-4 text-sm text-slate-900">{request.leaveTypeName || 'Unknown'}</td>
                        <td className="py-4 text-sm text-slate-600">
                          {new Date(request.startDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(request.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4 text-center text-sm text-slate-900">{request.totalDays}</td>
                        <td className="py-4">
                          <Badge
                            variant="outline"
                            className={`${statusColors[request.status as LeaveStatus] || 'bg-gray-100'} font-medium`}
                          >
                            {request.status}
                          </Badge>
                        </td>
                        <td className="py-4 text-sm text-slate-600">
                          {new Date(request.requestedDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-4">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900 cursor-pointer"
                              onClick={() => handleViewDetails(request)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>

                            <div className="flex w-8 justify-center">
                              {request.status === "Pending" && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600 cursor-pointer"
                                  onClick={() => handleCancelRequest(request.leaveRequestID)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600">
                Showing {requests.length} records
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="flex max-w-md flex-col items-center justify-center rounded-xl bg-white p-6 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D32F2F]/10 p-3">
            <TriangleAlert className="h-10 w-10 text-[#D32F2F]" />
          </div>
          <AlertDialogTitle className="mb-2 text-xl font-bold text-[#333333] sm:text-2xl">
            Confirm Cancellation
          </AlertDialogTitle>
          <AlertDialogDescription className="mb-6 text-center text-gray-600">
            Are you sure you want to cancel this leave request? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex w-full justify-center gap-3 sm:flex-row">
            <button
              onClick={confirmCancel}
              className="flex h-10 min-w-[84px] max-w-[480px] flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-[#D32F2F] px-4 text-sm font-bold leading-normal tracking-[0.015em] text-white transition-colors hover:bg-red-700"
            >
              <span className="truncate">Yes, Cancel</span>
            </button>
            <button
              onClick={() => setCancelDialogOpen(false)}
              className="flex h-10 min-w-[84px] max-w-[480px] flex-1 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-gray-200 px-4 text-sm font-bold leading-normal tracking-[0.015em] text-[#333333] transition-colors hover:bg-gray-300"
            >
              <span className="truncate">No, Keep It</span>
            </button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
