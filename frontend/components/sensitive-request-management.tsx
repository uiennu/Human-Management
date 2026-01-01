"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Eye, 
  Check, 
  X, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  User,
  Building,
  Calendar,
  ArrowRight,
  FileText
} from "lucide-react"
import { sensitiveRequestApi } from "@/lib/api/sensitive-request"
import type { GroupedSensitiveRequest, SensitiveRequestStats, UserAuthorizationInfo, DocumentInfo } from "@/types/sensitive-request"
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
import { Textarea } from "@/components/ui/textarea"

type RequestStatus = "Approved" | "Pending" | "Rejected"

const statusColors: Record<RequestStatus, string> = {
  Approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Pending: "bg-amber-100 text-amber-700 border-amber-200",
  Rejected: "bg-rose-100 text-rose-700 border-rose-200",
}

export default function SensitiveRequestManagement() {
  const [requests, setRequests] = useState<GroupedSensitiveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewingDocument, setViewingDocument] = useState<DocumentInfo | null>(null)
  const [activeSearchTerm, setActiveSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [stats, setStats] = useState<SensitiveRequestStats>({ all: 0, pending: 0, approved: 0, rejected: 0 })
  const [currentUserAuth, setCurrentUserAuth] = useState<UserAuthorizationInfo | null>(null)
  
  // Modal states
  const [viewingRequest, setViewingRequest] = useState<GroupedSensitiveRequest | null>(null)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [processing, setProcessing] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ open: boolean; type: 'success' | 'error'; message: string }>({
    open: false,
    type: 'success',
    message: ''
  })

  const pageSize = 10

  useEffect(() => {
    fetchRequests()
  }, [statusFilter, currentPage, activeSearchTerm])

  const fetchRequests = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await sensitiveRequestApi.getAll({
        status: statusFilter,
        page: currentPage,
        pageSize,
        search: activeSearchTerm || undefined,
      })
      setRequests(response.data)
      setTotalPages(response.totalPages)
      setTotalCount(response.totalCount)
      setStats(response.stats)
      if (response.currentUserAuth) {
        setCurrentUserAuth(response.currentUserAuth)
      }
    } catch (err: any) {
      console.error("Failed to fetch sensitive requests:", err)
      if (err.message === "UNAUTHORIZED") {
        setError("Session expired. Please login again.")
      } else if (err.message === "FORBIDDEN") {
        setError("You don't have permission to access this page.")
      } else {
        setError("Failed to load sensitive requests")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm)
    setCurrentPage(1)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleApprove = (id: number) => {
    setSelectedRequestId(id)
    setApproveDialogOpen(true)
  }

  const handleReject = (id: number) => {
    setSelectedRequestId(id)
    setRejectReason("")
    setRejectDialogOpen(true)
  }

  const confirmApprove = async () => {
    if (!selectedRequestId) return
    setProcessing(true)
    try {
      await sensitiveRequestApi.approve(selectedRequestId)
      setToast({ open: true, type: 'success', message: 'Request approved successfully!' })
      setApproveDialogOpen(false)
      setSelectedRequestId(null)
      setViewingRequest(null) // Close detail view if open
      fetchRequests()
    } catch (err: any) {
      setToast({ open: true, type: 'error', message: err.message || 'Failed to approve request' })
    } finally {
      setProcessing(false)
    }
  }

  const confirmReject = async () => {
    if (!selectedRequestId || !rejectReason.trim()) return
    setProcessing(true)
    try {
      await sensitiveRequestApi.reject(selectedRequestId, rejectReason)
      setToast({ open: true, type: 'success', message: 'Request rejected successfully!' })
      setRejectDialogOpen(false)
      setSelectedRequestId(null)
      setRejectReason("")
      setViewingRequest(null) // Close detail view if open
      fetchRequests()
    } catch (err: any) {
      setToast({ open: true, type: 'error', message: err.message || 'Failed to reject request' })
    } finally {
      setProcessing(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Hide toast after 3 seconds
  useEffect(() => {
    if (toast.open) {
      const timer = setTimeout(() => setToast({ ...toast, open: false }), 3000)
      return () => clearTimeout(timer)
    }
  }, [toast.open])

  return (
    <>
      {/* Detail view */}
      {viewingRequest ? (
        <div className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
          {/* Back button */}
          <Button 
            variant="ghost" 
            onClick={() => setViewingRequest(null)}
            className="mb-4"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>

          {/* Request Detail Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Sensitive Info Update Request</h2>
                  <p className="text-sm text-slate-600 mt-1">Request #{viewingRequest.requestGroupId}</p>
                </div>
                <Badge className={statusColors[viewingRequest.status as RequestStatus] || "bg-slate-100"}>
                  {viewingRequest.status}
                </Badge>
              </div>

              {/* Employee Info */}
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Employee</p>
                    <p className="font-semibold text-slate-900">{viewingRequest.employeeName}</p>
                    <p className="text-sm text-slate-600">{viewingRequest.employeeCode}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Building className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Department</p>
                    <p className="font-semibold text-slate-900">{viewingRequest.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Requested Date</p>
                    <p className="font-semibold text-slate-900">{formatDate(viewingRequest.requestedDate)}</p>
                  </div>
                </div>
                {viewingRequest.approverName && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Check className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Processed By</p>
                      <p className="font-semibold text-slate-900">{viewingRequest.approverName}</p>
                      {viewingRequest.approvalDate && (
                        <p className="text-sm text-slate-600">{formatDate(viewingRequest.approvalDate)}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Changes */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-600" />
                  Requested Changes
                </h3>
                <div className="space-y-4">
                  {viewingRequest.changes.map((change) => (
                    <div key={change.changeId} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-sm font-semibold text-slate-700 mb-2">{change.displayName}</p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 mb-1">Current Value</p>
                          <p className="text-sm text-slate-900 bg-white px-3 py-2 rounded border font-mono">
                            {change.oldValue || <span className="text-slate-400 italic">Not set</span>}
                          </p>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-slate-500 mb-1">New Value</p>
                          <p className="text-sm text-emerald-700 bg-emerald-50 px-3 py-2 rounded border border-emerald-200 font-mono font-semibold">
                            {change.newValue || <span className="text-slate-400 italic">Not set</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supporting Documents */}
              {viewingRequest.supportingDocuments && viewingRequest.supportingDocuments.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Supporting Documents
                  </h3>
                  <div className="space-y-3">
                    {viewingRequest.supportingDocuments.map((doc) => (
                      <div 
                        key={doc.documentId} 
                        className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:border-blue-400 transition-all cursor-pointer group"
                        onClick={() => setViewingDocument(doc)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                              {doc.documentPath.toLowerCase().endsWith('.pdf') ? (
                                <FileText className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Eye className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-blue-900">{doc.documentName}</p>
                              <p className="text-xs text-blue-600">
                                {doc.documentPath.toLowerCase().endsWith('.pdf') ? 'PDF Document' : 'Image File'}
                              </p>
                            </div>
                          </div>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg group-hover:bg-blue-700 transition-colors text-sm font-medium">
                            <Eye className="h-4 w-4" />
                            View
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {viewingRequest.status === "Pending" && (
                <div className="border-t mt-6 pt-6">
                  {viewingRequest.permission?.canApprove ? (
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        className="border-rose-300 text-rose-600 hover:bg-rose-50"
                        onClick={() => handleReject(viewingRequest.requestGroupId)}
                        disabled={processing}
                      >
                        <X className="mr-2 h-4 w-4" />
                        {processing ? 'Processing...' : 'Reject'}
                      </Button>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleApprove(viewingRequest.requestGroupId)}
                        disabled={processing}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {processing ? 'Processing...' : 'Approve'}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-amber-800 font-medium text-sm">
                        ⚠️ {viewingRequest.permission?.reason || "You don't have permission to approve this request"}
                      </p>
                      {viewingRequest.permission?.suggestedApprover && (
                        <p className="text-amber-600 text-sm mt-1">
                          Suggested approver: <span className="font-semibold">{viewingRequest.permission.suggestedApprover}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      ) : (
        <div className="min-h-screen bg-slate-50">
          <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="h-7 w-7 text-amber-600" />
              Sensitive Info Requests
            </h1>
            <p className="mt-0.5 text-sm text-slate-600">
              Review and manage employee sensitive information update requests
            </p>
          </div>
          {currentUserAuth && (
            <div className="text-right">
              <Badge className={
                currentUserAuth.roleLevel === 4 ? "bg-purple-100 text-purple-700" :
                currentUserAuth.roleLevel === 3 ? "bg-blue-100 text-blue-700" :
                "bg-slate-100 text-slate-700"
              }>
                {currentUserAuth.roleLevelName}
              </Badge>
              <p className="text-xs text-slate-500 mt-1">
                {currentUserAuth.roleLevel === 4 && "Full approval authority"}
                {currentUserAuth.roleLevel === 3 && "Can approve most requests"}
                {currentUserAuth.roleLevel === 2 && "Can approve standard employees"}
              </p>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
          >
            <CardContent className="!px-3 !py-2">
              <p className="text-sm font-medium text-slate-600">All Requests</p>
              <p className="text-2xl font-bold text-slate-900">{stats.all}</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => { setStatusFilter("Pending"); setCurrentPage(1); }}
          >
            <CardContent className="!px-3 !py-2">
              <p className="text-sm font-medium text-amber-600">Pending</p>
              <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => { setStatusFilter("Approved"); setCurrentPage(1); }}
          >
            <CardContent className="!px-3 !py-2">
              <p className="text-sm font-medium text-emerald-600">Approved</p>
              <p className="text-2xl font-bold text-emerald-700">{stats.approved}</p>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => { setStatusFilter("Rejected"); setCurrentPage(1); }}
          >
            <CardContent className="!px-3 !py-2">
              <p className="text-sm font-medium text-rose-600">Rejected</p>
              <p className="text-2xl font-bold text-rose-700">{stats.rejected}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3">
            <h2 className="mb-2 text-xs font-semibold text-slate-900">Filter & Search</h2>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
                <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="bg-slate-50 cursor-pointer">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="cursor-pointer">All</SelectItem>
                    <SelectItem value="Pending" className="cursor-pointer">Pending</SelectItem>
                    <SelectItem value="Approved" className="cursor-pointer">Approved</SelectItem>
                    <SelectItem value="Rejected" className="cursor-pointer">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[300px]">
                <label className="mb-2 block text-sm font-medium text-slate-700">Search Employee</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-slate-50"
                  />
                  <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error State */}
        {error && (
          <Card className="border-rose-200 bg-rose-50">
            <CardContent className="p-4">
              <p className="text-rose-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-600">Loading requests...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request List */}
        {!loading && !error && (
          <Card>
            <CardContent className="p-0">
              {requests.length === 0 ? (
                <div className="p-8 text-center">
                  <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600">No sensitive info requests found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Changes
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Doc
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Requested Date
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {requests.map((request) => (
                        <tr key={request.requestGroupId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-semibold text-slate-900">{request.employeeName}</p>
                              <p className="text-sm text-slate-500">{request.employeeCode}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-slate-700">{request.department}</p>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-1">
                              {request.changes.map((change) => (
                                <Badge 
                                  key={change.changeId} 
                                  variant="outline" 
                                  className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                                >
                                  {change.displayName}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {request.supportingDocuments && request.supportingDocuments.length > 0 ? (
                              <div 
                                className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-blue-100 rounded-full" 
                                title={request.supportingDocuments.map(d => d.documentName).join(', ')}
                              >
                                <FileText className="h-4 w-4 text-blue-600" />
                                {request.supportingDocuments.length > 1 && (
                                  <span className="text-xs font-medium text-blue-700">{request.supportingDocuments.length}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm text-slate-700">{formatDate(request.requestedDate)}</p>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={statusColors[request.status as RequestStatus] || "bg-slate-100"}>
                              {request.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewingRequest(request)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {request.status === "Pending" && request.permission?.canApprove && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApprove(request.requestGroupId)}
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    title="Approve"
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleReject(request.requestGroupId)}
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                    title="Reject"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {request.status === "Pending" && !request.permission?.canApprove && (
                                <span 
                                  className="text-xs text-amber-600 italic" 
                                  title={request.permission?.reason || "No permission"}
                                >
                                  {request.permission?.isSelfRequest ? "Self" : "Restricted"}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div>
                    <p className="text-sm text-slate-600">
                      Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Page {currentPage} of {totalPages}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      )}

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Approval</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this sensitive information update request? 
              This will update the employee's personal information immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmApprove}
              disabled={processing}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {processing ? "Processing..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Request</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this sensitive information update request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReject}
              disabled={processing || !rejectReason.trim()}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {processing ? "Processing..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Viewer Modal */}
      {viewingDocument && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setViewingDocument(null)}
        >
          <div 
            className="relative max-w-6xl max-h-[90vh] w-full bg-white rounded-xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-slate-50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {viewingDocument.documentPath.toLowerCase().endsWith('.pdf') ? (
                    <FileText className="h-5 w-5 text-red-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{viewingDocument.documentName}</p>
                  <p className="text-xs text-slate-600">
                    {viewingDocument.documentPath.toLowerCase().endsWith('.pdf') ? 'PDF Document' : 'Image File'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingDocument(null)}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-auto max-h-[calc(90vh-80px)] bg-slate-900 flex items-center justify-center p-8">
              {viewingDocument.documentPath.toLowerCase().endsWith('.pdf') ? (
                <div className="text-center p-12 bg-white rounded-lg">
                  <FileText className="w-24 h-24 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">PDF Document</h3>
                  <p className="text-slate-600 mb-4">
                    {viewingDocument.documentName}
                  </p>
                  <a
                    href={sensitiveRequestApi.getDocumentUrl(viewingDocument.documentPath)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <FileText className="w-4 h-4" />
                    Open PDF in New Tab
                  </a>
                </div>
              ) : (
                <img 
                  src={sensitiveRequestApi.getDocumentUrl(viewingDocument.documentPath)} 
                  alt={viewingDocument.documentName}
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.open && (
        <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}
    </>
  )
}
