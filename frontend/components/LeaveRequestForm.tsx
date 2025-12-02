"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, CloudUpload, X } from "lucide-react"
import { leaveService, LeaveType, LeaveBalance } from "@/lib/services/leaveService"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LeaveRequestFormProps {
  onCancel: () => void;
}

export default function LeaveRequestForm({ onCancel }: LeaveRequestFormProps) {
  // State
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);

  const [formData, setFormData] = useState({
    leaveTypeID: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    reason: "",
    isHalfDayStart: false,
    isHalfDayEnd: false,
    totalDays: 1
  });

  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState("")
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Mock Employee ID (In real app, get from auth context)
  const EMPLOYEE_ID = 2; // John Doe

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, totalDays: calculateTotalDays() }));
  }, [formData.startDate, formData.endDate, formData.isHalfDayStart, formData.isHalfDayEnd]);

  const loadData = async () => {
    try {
      const [types, userBalances] = await Promise.all([
        leaveService.getLeaveTypes(),
        leaveService.getMyBalances(EMPLOYEE_ID)
      ]);
      setLeaveTypes(types);
      setBalances(userBalances);
      if (types.length > 0) {
        setFormData(prev => ({ ...prev, leaveTypeID: types[0].leaveTypeID }));
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

    if (fileError) {
      setLoading(false);
      return;
    }

    try {
      await leaveService.createLeaveRequest(EMPLOYEE_ID, {
        ...formData,
        attachments: files
      });
      alert("Leave request submitted successfully!");
      onCancel();
    } catch (err: any) {
      setError(err.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8">
        <CardContent className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onCancel}>
                <ArrowLeft className="h-6 w-6" />
              </Button>
              <h1 className="text-2xl font-bold text-slate-900">New Leave Request</h1>
            </div>
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Form Section */}
            <div className="w-full lg:w-2/3 space-y-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Leave Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Leave Type</label>
                  <Select
                    value={formData.leaveTypeID.toString()}
                    onValueChange={(value) => setFormData({ ...formData, leaveTypeID: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((type) => (
                        <SelectItem key={type.leaveTypeID} value={type.leaveTypeID.toString()}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-slate-500">
                    Balance: <span className="font-semibold text-emerald-600">{getSelectedBalance()} days</span>
                  </p>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Start Date</label>
                    <input
                      type="date"
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="halfDayStart"
                        checked={formData.isHalfDayStart}
                        onChange={(e) => setFormData({ ...formData, isHalfDayStart: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      <label htmlFor="halfDayStart" className="text-sm text-slate-600">Half Day</label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">End Date</label>
                    <input
                      type="date"
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="checkbox"
                        id="halfDayEnd"
                        checked={formData.isHalfDayEnd}
                        onChange={(e) => setFormData({ ...formData, isHalfDayEnd: e.target.checked })}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                      />
                      <label htmlFor="halfDayEnd" className="text-sm text-slate-600">Half Day</label>
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Reason</label>
                  <textarea
                    className="flex min-h-[100px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    placeholder="Please describe the reason..."
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  />
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Attachments (Max 10MB)</label>
                  <div className="flex w-full items-center justify-center">
                    <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100">
                      <div className="flex flex-col items-center justify-center pb-6 pt-5">
                        <CloudUpload className="mb-2 h-8 w-8 text-slate-400" />
                        <p className="mb-2 text-sm text-slate-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500">Any file (Max 10MB total)</p>
                      </div>
                      <input type="file" className="hidden" multiple onChange={handleFileChange} />
                    </label>
                  </div>
                  {fileError && <p className="text-sm text-red-500">{fileError}</p>}
                  {files.length > 0 && (
                    <ul className="text-sm text-slate-600 list-disc pl-5 mt-2">
                      {files.map((file, index) => (
                        <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                      ))}
                    </ul>
                  )}
                </div>
              </form>
            </div>

            {/* Summary Section */}
            <div className="w-full lg:w-1/3">
              <div className="sticky top-8 rounded-lg bg-slate-50 p-6 border border-slate-200">
                <h3 className="border-b border-slate-200 pb-4 text-lg font-semibold text-slate-900">
                  Summary
                </h3>
                <div className="space-y-4 py-4">
                  <div className="flex justify-between">
                    <p className="text-sm text-slate-500">Leave Type:</p>
                    <p className="text-sm font-medium text-slate-900">
                      {leaveTypes.find(t => t.leaveTypeID === formData.leaveTypeID)?.name || 'Select type'}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-slate-500">Dates:</p>
                    <p className="text-sm font-medium text-slate-900">
                      {formData.startDate} - {formData.endDate}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-slate-500">Total Days:</p>
                    <p className="text-lg font-bold text-slate-900">{formData.totalDays}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col space-y-3 pt-6 border-t border-slate-200">
                  <Button
                    onClick={handleSubmit}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={loading || !!fileError}
                  >
                    {loading ? 'Submitting...' : 'Submit Request'}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={onCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}