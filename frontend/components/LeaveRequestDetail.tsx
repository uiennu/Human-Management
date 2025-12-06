"use client"

import { useEffect, useState } from "react"
import { X, FileText, Check, Upload } from "lucide-react"
import { leaveService } from "@/lib/api/leave-service"

interface LeaveRequestDetailProps {
  request: any; // Selected request (contains at least leaveRequestID and status)
  onBack: () => void;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  Approved: { bg: "bg-[#28A745]/20", text: "text-[#28A745]" },
  Pending: { bg: "bg-[#ED6C02]/20", text: "text-[#ED6C02]" },
  Rejected: { bg: "bg-[#D32F2F]/20", text: "text-[#D32F2F]" },
  Cancelled: { bg: "bg-gray-500/20", text: "text-gray-600" },
}

export default function LeaveRequestDetail({ request, onBack }: LeaveRequestDetailProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

const SERVER_ROOT = "http://localhost:5204";

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await leaveService.getLeaveRequestDetail(request.leaveRequestID);
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
                    <p className="font-medium text-[#111418]">Submitted by You</p>
                    <p className="text-sm text-[#617589]">
                      {new Date(details.requestedDate).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
    </div>
  )
}