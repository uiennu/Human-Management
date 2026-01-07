"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, CloudUpload, X, AlertTriangle, Calendar, Check } from "lucide-react"
import { leaveService } from "@/lib/api/leave-service"
import { toast } from "sonner" 

// Định nghĩa Type
interface LeaveType {
  leaveTypeID: number;
  name: string;
  description?: string;
}

interface LeaveBalance {
  leaveTypeID: number;
  balanceDays: number;
  name?: string;
}

interface LeaveRequestFormProps {
  employeeId: number | null;
  onCancel: () => void;
  onSuccess?: (requestId: number) => void;
}

export default function LeaveRequestForm({ employeeId, onCancel, onSuccess }: LeaveRequestFormProps) {
  // State
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);

  const [formData, setFormData] = useState({
    leaveTypeID: 0,
    startDate: "",
    endDate: "",
    reason: "",
    isHalfDayStart: false,
    isHalfDayEnd: false,
    totalDays: 0
  });

  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState("")
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState(""); // Cảnh báo nhẹ (màu vàng)
  const [primaryApprover, setPrimaryApprover] = useState<string | null>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  // --- LOGIC TÍNH TOÁN NGÀY ---
  useEffect(() => {
    const days = calculateBusinessDays(formData.startDate, formData.endDate);
    
    // Điều chỉnh Half-day
    let adjustedDays = days;
    if (days > 0) {
        if (formData.isHalfDayStart) adjustedDays -= 0.5;
        if (formData.isHalfDayEnd) adjustedDays -= 0.5;
    }
    
    setFormData(prev => ({ ...prev, totalDays: Math.max(0, adjustedDays) }));

    // Kiểm tra quy tắc báo trước 3 ngày
    checkNoticeRule(formData.startDate);

  }, [formData.startDate, formData.endDate, formData.isHalfDayStart, formData.isHalfDayEnd]);

  useEffect(() => {
    if (error && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [error]);

  const loadData = async () => {
    if (!employeeId) return;
    try {
      const [types, userBalances] = await Promise.all([
        leaveService.getLeaveTypes(),
        leaveService.getMyBalances(employeeId)
      ]);
      setLeaveTypes(types);
      setBalances(userBalances || []);

      try {
        const approver = await leaveService.getPrimaryApprover(employeeId);
        setPrimaryApprover(approver.managerName);
      } catch (approverErr) {
        console.log("No manager assigned - this is OK");
        setPrimaryApprover(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load leave data. Please check your connection.");
    }
  };

  const getSelectedBalance = () => {
    const balance = balances.find(b => b.leaveTypeID === formData.leaveTypeID);
    return balance ? balance.balanceDays : 0;
  };

  // --- HÀM MỚI: Tính ngày làm việc (Trừ T7, CN) ---
  const calculateBusinessDays = (startStr: string, endStr: string) => {
    if (!startStr || !endStr) return 0;
    
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    if (end < start) return 0;

    let count = 0;
    const curDate = new Date(start);

    while (curDate <= end) {
        const dayOfWeek = curDate.getDay();
        // 0 = Sunday, 6 = Saturday
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
        curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  };

  // --- HÀM MỚI: Cảnh báo báo trước 3 ngày ---
  const checkNoticeRule = (startStr: string) => {
      if (!startStr) {
          setWarning("");
          return;
      }
      const start = new Date(startStr);
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const diffTime = start.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 3 && diffDays >= 0) {
          setWarning("Note: Requests submitted less than 3 days in advance may require urgent approval.");
      } else {
          setWarning("");
      }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      // Cộng dồn file cũ và mới
      const updatedFiles = [...files, ...newFiles];
      
      const totalSize = updatedFiles.reduce((acc, file) => acc + file.size, 0)
      if (totalSize > 10 * 1024 * 1024) { // 10MB
        setFileError("Total file size must not exceed 10MB")
        return
      }

      setFileError("")
      setFiles(updatedFiles)
    }
  }

  // --- HÀM MỚI: Xóa file ---
  const removeFile = (indexToRemove: number) => {
      setFiles(files.filter((_, index) => index !== indexToRemove));
      setFileError(""); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.leaveTypeID === 0) {
      setError("Please select a leave type");
      setLoading(false);
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError("Please select start and end dates");
      setLoading(false);
      return;
    }

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError("End date cannot be earlier than start date");
      setLoading(false);
      return;
    }

    // --- CHECK MỚI: Chặn đơn 0 ngày ---
    if (formData.totalDays <= 0) {
        setError("Total leave duration must be greater than 0. Please check your dates (weekends are automatically excluded).");
        setLoading(false);
        return;
    }

    if (fileError) {
      setLoading(false);
      return;
    }

    if (!employeeId) return;

    try {
      const response = await leaveService.createLeaveRequest(employeeId, {
        ...formData,
        attachments: files
      });

      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        if (onSuccess && response?.leaveRequestID) {
          onSuccess(response.leaveRequestID);
        } else {
          onCancel();
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={topRef} className="min-h-screen w-full bg-[#F9FAFB] p-4 md:p-8 font-sans">
      <div className="mx-auto max-w-7xl h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={onCancel}
              className="rounded-full p-2 hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-700" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              New Leave Request
            </h1>
          </div>

          {/* Error & Warning Alerts */}
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-100 p-4 text-red-600 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}
          
          {warning && !error && (
            <div className="mb-6 rounded-lg bg-amber-50 border border-amber-100 p-4 text-amber-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
               <Calendar className="h-5 w-5 shrink-0" />
               {warning}
            </div>
          )}

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Form Section */}
            <div className="w-full lg:w-2/3">
              <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                
                <div className="grid grid-cols-1 gap-6">
                  {/* Leave Type */}
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-700">Leave Type <span className="text-red-500">*</span></span>
                    <div className="flex flex-col gap-3">
                      <select
                        className={`h-11 w-full rounded-lg border bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all ${formData.leaveTypeID === 0 ? "border-gray-300 text-gray-500" : "border-gray-300 text-gray-900"}`}
                        value={formData.leaveTypeID.toString()}
                        onChange={(e) => setFormData({ ...formData, leaveTypeID: parseInt(e.target.value, 10) })}
                      >
                        <option value="0">Select a leave type...</option>
                        {leaveTypes.map((type) => (
                          <option key={type.leaveTypeID} value={type.leaveTypeID}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      
                      {/* Balance Badge */}
                      {formData.leaveTypeID !== 0 && (
                          <div className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">
                              <span className="text-blue-600 font-medium">Available Balance:</span>
                              <span className="font-bold text-gray-900 text-lg">{getSelectedBalance()}</span>
                              <span className="text-gray-500">days</span>
                          </div>
                      )}
                    </div>
                  </label>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-gray-700">Start Date <span className="text-red-500">*</span></span>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </label>
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-gray-700">End Date <span className="text-red-500">*</span></span>
                      <input
                        type="date"
                        value={formData.endDate}
                        min={formData.startDate} // Prevent selecting past end dates
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </label>
                  </div>

                  {/* Half Day Options */}
                  <div className="flex flex-wrap gap-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="halfDayStart"
                        // Disable nếu đơn < 1 ngày hoặc (đơn 1 ngày VÀ đã chọn End) -> Ngăn tạo đơn 0 ngày
                        disabled={formData.totalDays <= 0.5 && !formData.isHalfDayStart}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        checked={formData.isHalfDayStart}
                        onChange={(e) => setFormData({ ...formData, isHalfDayStart: e.target.checked })}
                      />
                      <label htmlFor="halfDayStart" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Half-day at Start (PM only)
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="halfDayEnd"
                        // Tương tự ngược lại
                        disabled={formData.totalDays <= 0.5 && !formData.isHalfDayEnd}
                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        checked={formData.isHalfDayEnd}
                        onChange={(e) => setFormData({ ...formData, isHalfDayEnd: e.target.checked })}
                      />
                      <label htmlFor="halfDayEnd" className="text-sm font-medium text-gray-700 cursor-pointer">
                        Half-day at End (AM only)
                      </label>
                    </div>
                  </div>

                  {/* Reason */}
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-700">Reason</span>
                    <textarea
                      className="min-h-[120px] w-full resize-y rounded-lg border border-gray-300 bg-white p-4 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                      placeholder="Please describe the reason for your leave..."
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    ></textarea>
                  </label>

                  {/* File Upload */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-gray-700">Attachments</span>
                    <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pb-6 pt-5">
                          <CloudUpload className="mb-2 h-8 w-8 text-gray-400" />
                          <p className="mb-1 text-sm text-gray-500"><span className="font-semibold text-blue-600">Click to upload</span> or drag and drop</p>
                          <p className="text-xs text-gray-400">JPG, PNG, PDF (Max 10MB)</p>
                        </div>
                        <input type="file" className="hidden" multiple onChange={handleFileChange} />
                    </label>
                    
                    {fileError && <p className="text-sm text-red-500 mt-1">{fileError}</p>}
                    
                    {/* Danh sách file với nút Xóa */}
                    {files.length > 0 && (
                      <ul className="mt-2 space-y-2">
                        {files.map((file, index) => (
                          <li key={index} className="flex items-center justify-between rounded-md bg-white border border-gray-200 p-2 text-sm shadow-sm">
                            <span className="truncate text-gray-700 max-w-[80%]">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            <button 
                                type="button" 
                                onClick={() => removeFile(index)} 
                                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Primary Approver (Read only) */}
                  <div className="border-t border-gray-100 pt-6">
                    <label className="flex flex-col gap-2">
                      <span className="text-sm font-semibold text-gray-700">Primary Approver</span>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                              {primaryApprover ? primaryApprover.charAt(0) : "M"}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                              {primaryApprover || "Your Department Manager"}
                          </span>
                      </div>
                    </label>
                  </div>
                </div>
              </form>
            </div>

            {/* Summary Section (Sticky Sidebar) */}
            <div className="w-full lg:w-1/3">
              <div className="sticky top-8 rounded-xl bg-white p-6 shadow-sm border border-gray-100">
                <h3 className="border-b border-gray-100 pb-4 text-lg font-bold text-gray-900">
                  Request Summary
                </h3>
                <div className="space-y-4 py-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">Leave Type</p>
                    <p className="text-sm font-semibold text-gray-900 text-right max-w-[150px] truncate">
                      {leaveTypes.find((t) => t.leaveTypeID === formData.leaveTypeID)?.name || "-"}
                    </p>
                  </div>
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-500">Dates</p>
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                            {formData.startDate ? new Date(formData.startDate).toLocaleDateString() : "-"}
                        </p>
                        {formData.endDate && (
                            <p className="text-sm text-gray-400">to {new Date(formData.endDate).toLocaleDateString()}</p>
                        )}
                    </div>
                  </div>
                  
                  <div className="my-2 border-t border-dashed border-gray-200"></div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-base font-medium text-gray-700">Total Duration</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formData.totalDays} <span className="text-sm font-normal text-gray-500">days</span>
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col gap-3">
                  <button
                    onClick={handleSubmit}
                    // Disable nếu loading, lỗi file, hoặc 0 ngày
                    disabled={loading || !!fileError || formData.totalDays <= 0}
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-xl disabled:opacity-50 disabled:shadow-none"
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </button>
                  
                  {/* Draft button with Toast info */}
                  <button
                    type="button"
                    onClick={() => toast.info("Save draft feature coming soon!")}
                    className="w-full rounded-lg bg-white border border-gray-200 px-4 py-3 font-semibold text-gray-600 transition-colors hover:bg-gray-50"
                  >
                    Save as Draft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 text-center animate-in zoom-in duration-300">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-10 w-10 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600">
              Your leave request has been submitted successfully.
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to request details...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}