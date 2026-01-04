"use client"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, CloudUpload, Check } from "lucide-react"
import { leaveService } from "@/lib/api/leave-service"
import type { LeaveType, LeaveBalance } from "@/types/leave"

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
  const [primaryApprover, setPrimaryApprover] = useState<string | null>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const topRef = useRef<HTMLDivElement>(null);

  // Mock Employee ID (In real app, get from auth context)


  useEffect(() => {
    if (employeeId) {
      loadData();
    }
  }, [employeeId]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, totalDays: calculateTotalDays() }));
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
      setBalances(userBalances);

      // Fetch approver separately - don't block form if it fails
      try {
        const approver = await leaveService.getPrimaryApprover(employeeId);
        setPrimaryApprover(approver.managerName);
      } catch (approverErr) {
        console.log("No manager assigned - this is OK");
        setPrimaryApprover(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load leave data");
    }
  };

  const getSelectedBalance = () => {
    const balance = balances.find(b => b.leaveTypeID === formData.leaveTypeID);
    return balance ? balance.balanceDays : 0;
  };

  const calculateTotalDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (formData.isHalfDayStart) diffDays -= 0.5;
    if (formData.isHalfDayEnd) diffDays -= 0.5;

    return Math.max(0, diffDays);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0)

      if (totalSize > 10 * 1024 * 1024) { // 10MB
        setFileError("Total file size must not exceed 10MB")
        return
      }

      setFileError("")
      setFiles(selectedFiles)
    }
  }

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

      // Show success modal
      setShowSuccessModal(true);

      // Wait 2 seconds then navigate to detail
      setTimeout(() => {
        setShowSuccessModal(false);
        if (onSuccess && response?.leaveRequestID) {
          onSuccess(response.leaveRequestID);
        } else {
          onCancel();
        }
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={topRef} className="min-h-screen w-full bg-[#F9FAFB] p-4 md:p-8">
      <div className="mx-auto max-w-7xl h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onCancel}
                className="rounded-full p-2 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-900" />
              </button>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Leave Request Form
              </h1>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Form Section */}
            <div className="w-full lg:w-2/3">
              <form
                onSubmit={handleSubmit}
                className="rounded-lg bg-white p-6 shadow-sm"
              >
                <h2 className="border-b border-gray-200 pb-6 text-xl font-semibold text-gray-900">
                  New Leave Request
                </h2>

                <div className="mt-6 grid grid-cols-1 gap-6">
                  {/* Leave Type */}
                  <label className="flex flex-col">
                    <p className="pb-2 text-sm font-medium text-gray-700">Leave Type</p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <select
                        className={`h-12 flex-1 rounded-lg border border-gray-300 bg-white px-4 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${formData.leaveTypeID === 0 ? "text-gray-400" : "text-gray-900"
                          }`}
                        value={formData.leaveTypeID.toString()}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            leaveTypeID: parseInt(e.target.value, 10),
                          })
                        }
                      >
                        <option value="0">Please select</option>
                        {leaveTypes.map((type) => (
                          <option key={type.leaveTypeID} value={type.leaveTypeID}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                      <p className="whitespace-nowrap text-sm font-medium text-gray-500">
                        Balance:{" "}
                        <span className="font-semibold text-emerald-500">
                          {getSelectedBalance()} days
                        </span>
                      </p>
                    </div>
                  </label>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <label className="flex flex-col">
                      <p className="pb-2 text-sm font-medium text-gray-700">Start Date</p>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          setFormData({ ...formData, startDate: e.target.value })
                        }
                        className={`h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${formData.startDate ? "text-gray-900" : "text-gray-400"
                          }`}
                      />
                    </label>
                    <label className="flex flex-col">
                      <p className="pb-2 text-sm font-medium text-gray-700">End Date</p>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          setFormData({ ...formData, endDate: e.target.value })
                        }
                        className={`h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-base focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${formData.endDate ? "text-gray-900" : "text-gray-400"
                          }`}
                      />
                    </label>
                  </div>

                  {/* Half Day Checkboxes */}
                  <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-700">Half-day Start</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="halfDayStart"
                          className="h-4 w-4 rounded text-blue-500 focus:ring-blue-500/50"
                          checked={formData.isHalfDayStart}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isHalfDayStart: e.target.checked,
                            })
                          }
                        />
                        <label
                          htmlFor="halfDayStart"
                          className="text-sm text-gray-700"
                        >
                          Enable
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-700">Half-day End</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="halfDayEnd"
                          className="h-4 w-4 rounded text-blue-500 focus:ring-blue-500/50"
                          checked={formData.isHalfDayEnd}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isHalfDayEnd: e.target.checked,
                            })
                          }
                        />
                        <label
                          htmlFor="halfDayEnd"
                          className="text-sm text-gray-700"
                        >
                          Enable
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Total Days:{" "}
                      <span className="font-bold text-blue-500">
                        {formData.totalDays}
                      </span>
                    </p>
                  </div>

                  {/* Reason */}
                  <label className="flex flex-col">
                    <p className="pb-2 text-sm font-medium text-gray-700">
                      Reason for Leave (Optional)
                    </p>
                    <textarea
                      className="h-32 w-full resize-y rounded-lg border border-gray-300 bg-white p-4 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Enter reason here..."
                      value={formData.reason}
                      onChange={(e) =>
                        setFormData({ ...formData, reason: e.target.value })
                      }
                    ></textarea>
                  </label>

                  {/* File Upload */}
                  <label className="flex flex-col">
                    <p className="pb-2 text-sm font-medium text-gray-700">Attachments</p>
                    <div className="flex w-full items-center justify-center">
                      <label
                        htmlFor="dropzone-file"
                        className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100"
                      >
                        <div className="flex flex-col items-center justify-center pb-6 pt-5">
                          <CloudUpload className="mb-2 h-8 w-8 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">
                            Any file (Max 10MB total)
                          </p>
                        </div>
                        <input
                          id="dropzone-file"
                          type="file"
                          className="hidden"
                          multiple
                          onChange={handleFileChange}
                        />
                      </label>
                    </div>
                    {fileError && (
                      <p className="mt-1 text-sm text-red-500">{fileError}</p>
                    )}
                    {files.length > 0 && (
                      <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                        {files.map((file, index) => (
                          <li key={index}>
                            {file.name} (
                            {(file.size / 1024 / 1024).toFixed(2)} MB)
                          </li>
                        ))}
                      </ul>
                    )}
                  </label>

                  {/* Approval Info (static visual, no API change) */}
                  <div className="mt-8 border-t border-gray-200 pt-6">
                    <h3 className="pb-4 text-lg font-semibold text-gray-900">
                      Approval Information
                    </h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <label className="flex flex-col">
                        <p className="pb-2 text-sm font-medium text-gray-700">
                          Primary Approver
                        </p>
                        <input
                          className="h-12 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 text-base text-gray-900"
                          disabled
                          value={primaryApprover || "Your Manager"}
                        />
                      </label>
                    </div>
                  </div>
                </div>


              </form>
            </div>

            {/* Summary Section (Sticky Sidebar) */}
            <div className="w-full lg:w-1/3">
              <div className="sticky top-8 rounded-lg bg-white p-6 shadow-sm">
                <h3 className="border-b border-gray-200 pb-4 text-lg font-semibold text-gray-900">
                  Summary
                </h3>
                <div className="space-y-4 py-4">
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">Leave Type:</p>
                    <p className="text-sm font-medium text-gray-800">
                      {leaveTypes.find((t) => t.leaveTypeID === formData.leaveTypeID)
                        ?.name || "Select type"}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">Dates:</p>
                    <p className="text-sm font-medium text-gray-800">
                      {formData.startDate} - {formData.endDate}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">Total Days:</p>
                    <p className="text-lg font-bold text-gray-800">
                      {formData.totalDays}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col space-y-3 border-t border-gray-200 pt-6">
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !!fileError}
                    className="w-full rounded-lg bg-blue-500 px-4 py-2.5 font-semibold text-white transition-colors duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-70"
                  >
                    {loading ? "Submitting..." : "Submit Request"}
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-lg bg-gray-200 px-4 py-2.5 font-semibold text-gray-800 transition-colors duration-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  >
                    Save as Draft
                  </button>

                  <button
                    onClick={onCancel}
                    className="w-full rounded-lg bg-gray-200 px-4 py-2.5 font-semibold text-gray-800 transition-colors duration-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  >
                    Cancel
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
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-8 text-center">
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