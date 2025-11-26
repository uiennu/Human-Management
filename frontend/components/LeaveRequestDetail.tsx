"use client"

import { X, FileText, Check, Upload, Download } from "lucide-react"

// Định nghĩa kiểu dữ liệu (tạm thời)
interface LeaveRequestDetailProps {
  request: any; // Dữ liệu của yêu cầu được chọn
  onBack: () => void; // Hàm quay lại danh sách
}

// Map màu sắc cho Badge trạng thái
const statusStyles: Record<string, { bg: string; text: string }> = {
  Approved: { bg: "bg-[#28A745]/20", text: "text-[#28A745]" },
  Pending: { bg: "bg-[#ED6C02]/20", text: "text-[#ED6C02]" },
  Rejected: { bg: "bg-[#D32F2F]/20", text: "text-[#D32F2F]" },
  Cancelled: { bg: "bg-gray-500/20", text: "text-gray-600" },
}

export default function LeaveRequestDetail({ request, onBack }: LeaveRequestDetailProps) {
  // Lấy style màu dựa trên trạng thái, mặc định là xám nếu không tìm thấy
  const statusStyle = statusStyles[request.status] || statusStyles.Cancelled;

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col bg-[#f6f7f8] font-sans">
      <div className="flex h-full grow flex-col">
        <div className="flex flex-1 justify-center px-4 py-5 sm:px-10 md:px-20 lg:px-40">
          <div className="flex flex-1 flex-col max-w-[960px] rounded-xl bg-white shadow-lg">
            
            {/* --- HEADER --- */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-4">
                <p className="text-2xl font-black tracking-[-0.033em] text-[#111418] sm:text-3xl">
                  Leave Request Details
                </p>
                <div className={`flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg px-4 ${statusStyle.bg}`}>
                  <p className={`text-sm font-medium leading-normal uppercase ${statusStyle.text}`}>
                    {request.status}
                  </p>
                </div>
              </div>
              <button 
                onClick={onBack}
                className="text-gray-500 hover:text-gray-800 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* --- BODY --- */}
            <div className="p-4 sm:p-6">
              <h2 className="pb-3 text-xl font-bold tracking-[-0.015em] text-[#111418]">
                Request Details
              </h2>
              
              {/* Grid thông tin */}
              <div className="grid grid-cols-1 gap-x-6 p-4 sm:grid-cols-[1fr_2fr]">
                
                {/* Leave Type */}
                <div className="col-span-1 grid grid-cols-subgrid border-t border-[#dbe0e6] py-4 sm:col-span-2">
                  <p className="text-sm font-normal leading-normal text-[#617589]">Leave Type</p>
                  <p className="text-sm font-normal leading-normal text-[#111418]">{request.leaveType}</p>
                </div>

                {/* Dates */}
                <div className="col-span-1 grid grid-cols-subgrid border-t border-[#dbe0e6] py-4 sm:col-span-2">
                  <p className="text-sm font-normal leading-normal text-[#617589]">Dates</p>
                  <p className="text-sm font-normal leading-normal text-[#111418]">
                    {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Half-day Info (Hardcoded demo) */}
                <div className="col-span-1 grid grid-cols-subgrid border-t border-[#dbe0e6] py-4 sm:col-span-2">
                  <p className="text-sm font-normal leading-normal text-[#617589]">Half-day Info</p>
                  <p className="text-sm font-normal leading-normal text-[#111418]">Not applicable</p>
                </div>

                {/* Total Days */}
                <div className="col-span-1 grid grid-cols-subgrid border-t border-[#dbe0e6] py-4 sm:col-span-2">
                  <p className="text-sm font-normal leading-normal text-[#617589]">Total Days</p>
                  <p className="text-sm font-normal leading-normal text-[#111418]">{request.totalDays}</p>
                </div>

                {/* Reason (Hardcoded demo) */}
                <div className="col-span-1 grid grid-cols-subgrid border-t border-[#dbe0e6] py-4 sm:col-span-2">
                  <p className="text-sm font-normal leading-normal text-[#617589]">Reason</p>
                  <p className="text-sm font-normal leading-normal text-[#111418]">Family vacation to the beach.</p>
                </div>

                {/* Attachments */}
                <div className="col-span-1 grid grid-cols-subgrid border-y border-[#dbe0e6] py-4 sm:col-span-2">
                  <p className="pt-2 self-start text-sm font-normal leading-normal text-[#617589]">Attachments</p>
                  <div>
                    <div className="flex min-h-14 items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f2f4] text-[#111418]">
                          <FileText className="h-6 w-6" />
                        </div>
                        <p className="flex-1 truncate text-base font-normal leading-normal text-[#111418]">
                          Flight_Confirmation.pdf
                        </p>
                      </div>
                      <div className="shrink-0">
                        <button className="text-base font-medium leading-normal text-[#137fec] hover:underline">
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* --- ACTIVITY LOG --- */}
              <h2 className="px-4 pb-3 pt-5 text-xl font-bold tracking-[-0.015em] text-[#111418]">
                Activity Log
              </h2>
              <div className="flex flex-col gap-4 p-4">
                
                {/* Log Item 1 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#137fec]/20">
                      <Check className="h-5 w-5 text-[#137fec]" />
                    </div>
                    <div className="h-full w-px bg-gray-300"></div>
                  </div>
                  <div className="pb-8">
                    <p className="font-medium text-[#111418]">Approved by {request.approver} (Manager)</p>
                    <p className="text-sm text-[#617589]">23/07/2024 at 09:15 AM</p>
                    <p className="mt-2 rounded-lg bg-[#f6f7f8] p-3 text-sm text-[#111418]">
                      Have a great time!
                    </p>
                  </div>
                </div>

                {/* Log Item 2 */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#137fec]/20">
                      <Upload className="h-5 w-5 text-[#137fec]" />
                    </div>
                    {/* Dòng kẻ cuối cùng thường ẩn hoặc để mờ nếu là item cuối */}
                    <div className="h-full w-px bg-transparent"></div> 
                  </div>
                  <div className="pb-8">
                    <p className="font-medium text-[#111418]">Submitted by You</p>
                    <p className="text-sm text-[#617589]">
                      {new Date(request.submittedDate).toLocaleDateString()} at 02:30 PM
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}