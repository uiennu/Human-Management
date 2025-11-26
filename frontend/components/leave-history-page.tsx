"use client"

import { useState,useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Eye, X, Plus, TriangleAlert } from "lucide-react"
import LeaveRequestForm from "./LeaveRequestForm"
import LeaveRequestDetail from "./LeaveRequestDetail"
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

// Mock data - Replace with API calls to ASP.NET backend
const mockLeaveRequests = [
  {
    id: 1,
    leaveType: "Vacation",
    startDate: "2023-10-20",
    endDate: "2023-10-22",
    totalDays: 3,
    status: "Approved",
    approver: "Jane Doe",
    submittedDate: "2023-10-01",
  },
  {
    id: 2,
    leaveType: "Sick Leave",
    startDate: "2023-11-15",
    endDate: "2023-11-15",
    totalDays: 1,
    status: "Pending",
    approver: "John Smith",
    submittedDate: "2023-11-10",
  },
  {
    id: 3,
    leaveType: "Personal Day",
    startDate: "2023-12-01",
    endDate: "2023-12-01",
    totalDays: 1,
    status: "Rejected",
    approver: "Jane Doe",
    submittedDate: "2023-11-20",
  },
  {
    id: 4,
    leaveType: "Vacation",
    startDate: "2023-12-24",
    endDate: "2023-12-28",
    totalDays: 5,
    status: "Pending",
    approver: "Jane Doe",
    submittedDate: "2023-11-28",
  },
  {
    id: 5,
    leaveType: "Vacation",
    startDate: "2023-09-01",
    endDate: "2023-09-05",
    totalDays: 5,
    status: "Cancelled",
    approver: "John Smith",
    submittedDate: "2023-08-15",
  },
]

type LeaveStatus = "Approved" | "Pending" | "Rejected" | "Cancelled"

const statusColors: Record<LeaveStatus, string> = {
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Rejected: "bg-rose-100 text-rose-700 border-rose-200",
  Cancelled: "bg-slate-100 text-slate-600 border-slate-200",
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

  const itemsPerPage = 5
  const totalItems = 100 // Mock total - Replace with actual count from API
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const handleCancelRequest = (id: number) => {
    setSelectedRequestId(id)
    setCancelDialogOpen(true)
  }

  const confirmCancel = () => {
    // TODO: Call ASP.NET API to cancel request
    console.log("Cancelling request:", selectedRequestId)
    setCancelDialogOpen(false)
    setSelectedRequestId(null)
  }

  const handleViewDetails = (id: number) => {
    // TODO: Navigate to details page or open modal
    console.log("Viewing details for request:", id)
  }

  const handleApplyFilters = () => {
    // TODO: Call ASP.NET API with filter parameters
    console.log("Applying filters:", { statusFilter, dateRangeFilter, leaveTypeFilter })
  }

  const handleClearFilters = () => {
    setStatusFilter("all")
    setDateRangeFilter("last-30-days")
    setLeaveTypeFilter("all")
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
          <Button className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowCreateForm(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Leave Request
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600">Leave Balance</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">15 Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600">Leave Used</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">5 Days</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-slate-600">Pending Requests</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">2</p>
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
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="mb-2 block text-sm font-medium text-slate-700">Date Range</label>
                <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="Last 30 Days" />
                  </SelectTrigger>
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
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="vacation">Vacation</SelectItem>
                    <SelectItem value="sick-leave">Sick Leave</SelectItem>
                    <SelectItem value="personal-day">Personal Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleApplyFilters} className="bg-blue-600 hover:bg-blue-700">
                  Apply Filters
                </Button>
                <Button onClick={handleClearFilters} variant="outline">
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
                      Approver
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
                  {mockLeaveRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50">
                      <td className="py-4 text-sm text-slate-900">{request.leaveType}</td>
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
                          className={`${statusColors[request.status as LeaveStatus]} font-medium`}
                        >
                          {request.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-sm text-slate-600">{request.approver}</td>
                      <td className="py-4 text-sm text-slate-600">
                        {new Date(request.submittedDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center justify-center gap-2">
                          {/* Nút Xem (Eye) - Luôn hiện */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900"
                            onClick={() => setViewingRequest(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* HỘP GIỮ CHỖ CỐ ĐỊNH CHO NÚT X (Quan trọng) */}
                          {/* w-8 đảm bảo khoảng trống này luôn tồn tại dù có nút X hay không */}
                          <div className="flex w-8 justify-center">
                            {request.status === "Pending" && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-slate-600 hover:text-rose-600"
                                onClick={() => handleCancelRequest(request.id)}
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

            {/* Pagination */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600">
                Showing 1-{itemsPerPage} of {totalItems}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                {[1, 2, 3, "...", totalPages].map((page, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={currentPage === page ? "default" : "outline"}
                    className={currentPage === page ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                    onClick={() => typeof page === "number" && setCurrentPage(page)}
                    disabled={page === "..."}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
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

