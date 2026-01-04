"use client"

import { useEffect, useState } from "react"
import { leaveService } from "@/lib/api/leave-service"
import { utilityApi } from "@/lib/api/utility"
import { X, FileText, Check, Upload, Download, Loader2 } from "lucide-react"

interface LeaveRequestDetailProps {
  request: any; // Selected request (contains at least leaveRequestID and status)
  onBack: () => void;
  isManagerView?: boolean;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  Approved: { bg: "bg-[#28A745]/20", text: "text-[#28A745]" },
  Pending: { bg: "bg-[#ED6C02]/20", text: "text-[#ED6C02]" },
  Rejected: { bg: "bg-[#D32F2F]/20", text: "text-[#D32F2F]" },
  Cancelled: { bg: "bg-gray-500/20", text: "text-gray-600" },
}

export default function LeaveRequestDetail({ request, onBack, isManagerView = false }: LeaveRequestDetailProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const SERVER_ROOT = "http://localhost:5204";

  const [downloading, setDownloading] = useState(false);

  // Approval/Decline modal state
  const [showApproveModal, setShowApproveModal] = useState(false)
  const [showDeclineModal, setShowDeclineModal] = useState(false)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [commentError, setCommentError] = useState("")

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")


  useEffect(() => {
    const loadDetails = async () => {
      try {
        // --- SỬA LỖI Ở ĐÂY: Thêm ": any" để TypeScript không báo đỏ ---
        const data: any = await leaveService.getLeaveRequestDetail(request.leaveRequestID);

        // Nếu API trả về thiếu employeeName nhưng request cha có, ta merge vào
        if (!data.employeeName && request.employeeName) {
          data.employeeName = request.employeeName;
        }
        setDetails(data);
      } catch (error) {
        console.error("Failed to load details", error);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [request]);

  if (loading) {
    return <div className="p-8 text-center">Loading details...</div>;
  }

  if (!details) {
    return <div className="p-8 text-center text-red-500">Failed to load details</div>;
  }

  // Normalize API base: remove trailing /api if NEXT_PUBLIC_API_URL includes it
  const rawApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5204";
  const API_BASE = rawApi.replace(/\/api\/?$/, "");

  const status = details.status || request.status;
  const statusStyle = statusStyles[status] || statusStyles.Cancelled;

  const halfDayInfo = (() => {
    if (details.isHalfDayStart && details.isHalfDayEnd) {
      return "Half-day at start and end";
    }
    if (details.isHalfDayStart) return "Half-day at start";
    if (details.isHalfDayEnd) return "Half-day at end";
    return "Not applicable";
  })();

  const hasApproval = !!details.approvalInfo;
  const getImageUrl = (path: string) => {
    if (!path) return "";

    // 1. Xóa chữ "api/" ở đầu nếu lỡ có
    // 2. Xóa các dấu gạch chéo thừa ở đầu chuỗi (ví dụ /uploads -> uploads)
    // 3. Đổi tất cả dấu gạch chéo ngược "\" (Windows) thành "/" (Web)
    const cleanPath = path
      .replace(/^api\//i, "")
      .replace(/^[\\/]+/, "")
      .replace(/\\/g, "/");

    return `${SERVER_ROOT}/${cleanPath}`;
  };
  const openAttachment = (path: string) => {
    const url = getImageUrl(path);
    console.log("Opening URL:", url); // Log để kiểm tra nếu còn lỗi
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
    if (isImage) {
      setSelectedImage(url);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  // Action handlers
  const handleApprove = () => {
    setComment("")
    setCommentError("")
    setShowApproveModal(true)
  }

  const handleDecline = () => {
    setComment("")
    setCommentError("")
    setShowDeclineModal(true)
  }

  const submitApproval = async () => {
    setSubmitting(true)
    try {
      await leaveService.approveRequest(details.leaveRequestID, comment)
      setShowApproveModal(false)

      // Show success modal
      setSuccessMessage("Request approved successfully!")
      setShowSuccessModal(true)

      // Wait 2 seconds then go back
      setTimeout(() => {
        setShowSuccessModal(false)
        onBack()
      }, 2000)
    } catch (error) {
      console.error("Failed to approve request", error)
      alert("❌ Failed to approve request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const submitDecline = async () => {
    // Validate comment is required
    if (!comment.trim()) {
      setCommentError("Comment is required for declining a request")
      return
    }

    setSubmitting(true)
    try {
      await leaveService.declineRequest(details.leaveRequestID, comment)
      setShowDeclineModal(false)

      // Show success modal
      setSuccessMessage("Request declined successfully!")
      setShowSuccessModal(true)

      // Wait 2 seconds then go back
      setTimeout(() => {
        setShowSuccessModal(false)
        onBack()
      }, 2000)
    } catch (error) {
      console.error("Failed to decline request", error)
      alert("❌ Failed to decline request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f6f7f8] font-sans">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center px-4 py-5 sm:px-10 md:px-20 lg:px-40">
          <div className="flex flex-1 max-w-[960px] flex-col rounded-xl bg-white shadow-lg">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <p className="text-2xl font-black tracking-[-0.033em] text-[#111418] sm:text-3xl">
                  Leave Request Details
                </p>
                <div
                  className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 ${statusStyle.bg}`}
                >
                  <p
                    className={`text-sm font-medium leading-normal uppercase ${statusStyle.text}`}
                  >
                    {status}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    setDownloading(true);
                    try {
                      await utilityApi.generateLeavePdf({
                        employeeName: details.employeeName || "Employee",
                        leaveType: details.leaveType?.name,
                        startDate: new Date(details.startDate).toLocaleDateString(),
                        endDate: new Date(details.endDate).toLocaleDateString(),
                        totalDays: details.totalDays,
                        reason: details.reason,
                        leaveRequestId: details.leaveRequestID
                      });
                    } finally {
                      setDownloading(false);
                    }
                  }}
                  disabled={downloading}
                  className="flex h-8 items-center gap-2 rounded-lg bg-[#137fec] px-3 text-sm font-medium text-white hover:bg-[#137fec]/90 disabled:opacity-50"
                >
                  {downloading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  PDF
                </button>
              </div>
              <button
                onClick={onBack}
                className="text-gray-500 transition-colors hover:text-gray-800"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6">
              <h2 className="pb-3 text-xl font-bold tracking-[-0.015em] text-[#111418]">
                Request Details
              </h2>

              <div className="grid grid-cols-1 gap-x-6 p-4 sm:grid-cols-[1fr_2fr]">
                {/* Leave Type */}
                <div className="col-span-1 grid grid-cols-subgrid border-t border-[#dbe0e6] py-4 sm:col-span-2">
                  <p className="text-sm font-normal leading-normal text-[#617589]">
                    Leave Type
                  </p>
                  <p className="text-sm font-normal leading-normal text-[#111418]">
                    {details.leaveType?.name ?? "Unknown"}
                  </p>
                </div>

                {/* Dates */}
                <div className="col-span-1 grid grid-cols-subgrid border-t border-[#dbe0e6] py-4 sm:col-span-2">
                  <p className="text-sm font-normal leading-normal text-[#617589]">
                    Dates
                  </p>
                  <p className="text-sm font-normal leading-normal text-[#111418]">
                    {new Date(details.startDate).toLocaleDateString()} -{" "}
                    {new Date(details.endDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Half-day Info */}
                <div className="col-span-1 grid grid-cols-subgrid border-t border-[#dbe0e6] py-4 sm:col-span-2">
                  <p className="text-sm font-normal leading-normal text-[#617589]">
                    Half-day Info
                  </p>
                  <p className="text-sm font-normal leading-normal text-[#111418]">
                    {halfDayInfo}
                  </p>
                </div>

                {/* Total Days */}
                <div className="col-span-1 grid grid-cols-subgrid border-t border-[#dbe0e6] py-4 sm:col-span-2">
                  <p className="text-sm font-normal leading-normal text-[#617589]">
                    Total Days
                  </p>
                  <p className="text-sm font-normal leading-normal text-[#111418]">
                    {details.totalDays}
                  </p>
                </div>

                {/* Reason */}
                <div className="col-span-1 grid grid-cols-subgrid border-t border-[#dbe0e6] py-4 sm:col-span-2">
                  <p className="text-sm font-normal leading-normal text-[#617589]">
                    Reason
                  </p>
                  <p className="text-sm font-normal leading-normal text-[#111418]">
                    {details.reason || "No reason provided."}
                  </p>
                </div>

                {/* Attachments */}
                <div className="col-span-1 grid grid-cols-subgrid border-y border-[#dbe0e6] py-4 sm:col-span-2">
                  <p className="self-start pt-2 text-sm font-normal leading-normal text-[#617589]">
                    Attachments
                  </p>
                  <div className="space-y-3">
                    {details.attachments && details.attachments.length > 0 ? (
                      details.attachments.map((path: string, index: number) => {
                        const fileName = path.split(/[/\\]/).pop();
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
                        const url = getImageUrl(path);
                        return (
                          <div
                            key={index}
                            className="flex min-h-14 items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#f0f2f4] text-[#111418]">
                                {isImage ? (
                                  <img
                                    src={url}
                                    alt={fileName || "attachment"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <FileText className="h-6 w-6" />
                                )}
                              </div>
                              <p className="flex-1 truncate text-base font-normal leading-normal text-[#111418]">
                                {fileName}
                              </p>
                            </div>
                            <div className="shrink-0">
                              <button
                                type="button"
                                onClick={() => openAttachment(path)}
                                className="text-base font-medium leading-normal text-[#137fec] hover:underline"
                              >
                                View
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm text-gray-400 italic">No attachments</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Activity Log */}
              <h2 className="px-4 pb-3 pt-5 text-xl font-bold tracking-[-0.015em] text-[#111418]">
                Activity Log
              </h2>
              <div className="flex flex-col gap-4 p-4">
                {/* Approval item (if exists) */}
                {hasApproval && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#137fec]/20">
                        <Check className="h-5 w-5 text-[#137fec]" />
                      </div>
                      <div className="h-full w-px bg-gray-300"></div>
                    </div>
                    <div className="pb-8">
                      <p className="font-medium text-[#111418]">
                        {status === "Approved" ? "Approved" : "Rejected"} by{" "}
                        {details.approvalInfo.approverName} (Manager)
                      </p>
                      <p className="text-sm text-[#617589]">
                        {new Date(details.approvalInfo.actionDate).toLocaleString()}
                      </p>
                      {details.approvalInfo.note && (
                        <p className="mt-2 rounded-lg bg-[#f6f7f8] p-3 text-sm text-[#111418]">
                          {details.approvalInfo.note}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Submitted item */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#137fec]/20">
                      <Upload className="h-5 w-5 text-[#137fec]" />
                    </div>
                    <div className="h-full w-px bg-transparent"></div>
                  </div>
                  <div className="pb-8">
                    {/* --- ĐÃ SỬA: Hiển thị tên nhân viên nếu là quản lý xem --- */}
                    <p className="font-medium text-[#111418]">
                      Submitted by {isManagerView ? (request.employeeName || details.employeeName || 'Employee') : 'You'}
                    </p>
                    <p className="text-sm text-[#617589]">
                      {new Date(details.requestedDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons - Only show for managers viewing pending requests */}
              {isManagerView && status === "Pending" && (
                <div className="flex gap-3 px-4 pb-6 pt-4">
                  <button
                    onClick={handleApprove}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
                  >
                    <Check className="h-5 w-5" />
                    Approve Request
                  </button>
                  <button
                    onClick={handleDecline}
                    className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-3 text-sm font-bold text-white hover:bg-rose-700 transition-colors"
                  >
                    <X className="h-5 w-5" />
                    Decline Request
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Approve Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to approve this leave request?
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full rounded-lg border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
              rows={4}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={submitting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitApproval}
                disabled={submitting}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Approving..." : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Decline Request</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for declining this request.
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comment <span className="text-rose-600">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value)
                setCommentError("")
              }}
              placeholder="Reason for declining..."
              className={`w-full rounded-lg border p-3 text-sm outline-none transition-colors ${commentError
                ? "border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-200"
                : "border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                }`}
              rows={4}
            />
            {commentError && (
              <p className="text-sm text-rose-600 mt-1">{commentError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeclineModal(false)
                  setCommentError("")
                }}
                disabled={submitting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitDecline}
                disabled={submitting}
                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? "Declining..." : "Confirm Decline"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg bg-black/5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-2 text-white hover:bg-black/80"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedImage}
              alt="Attachment preview"
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600">
              {successMessage}
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Returning to approval list...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
