"use client"

import { useState } from "react"
import { ArrowLeft, CloudUpload } from "lucide-react"

interface LeaveRequestFormProps {
  onCancel: () => void;
}

export default function LeaveRequestForm({ onCancel }: LeaveRequestFormProps) {
  // Demo state cơ bản
  const [startDate, setStartDate] = useState("2023-10-26")
  const [endDate, setEndDate] = useState("2023-10-27")

  return (
    // THAY ĐỔI Ở ĐÂY:
    // 1. Xóa 'lg:px-20 xl:px-40' (nguyên nhân gây hẹp)
    // 2. Giữ lại 'p-4 md:p-8' để có khoảng hở vừa phải
    <div className="min-h-screen w-full bg-[#F9FAFB] p-4 md:p-8">
      
      {/* THÊM CONTAINER NÀY: */}
      {/* 'mx-auto': Căn giữa màn hình */}
      {/* 'max-w-7xl': Giới hạn độ rộng tối đa khoảng 1280px (Rộng hơn nhiều so với cũ) */}
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

          <div className="flex flex-col gap-8 lg:flex-row">
            {/* Form Section */}
            <div className="w-full lg:w-2/3">
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h2 className="border-b border-gray-200 pb-6 text-xl font-semibold text-gray-900">
                  New Leave Request
                </h2>
                
                <div className="mt-6 grid grid-cols-1 gap-6">
                  {/* Leave Type */}
                  <label className="flex flex-col">
                    <p className="pb-2 text-sm font-medium text-gray-700">Leave Type</p>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <select className="h-12 flex-1 rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                        <option>Annual Leave</option>
                        <option>Sick Leave</option>
                        <option>Unpaid Leave</option>
                      </select>
                      <p className="whitespace-nowrap text-sm font-medium text-gray-500">
                        Balance: <span className="font-semibold text-emerald-500">10 days</span>
                      </p>
                    </div>
                  </label>

                  {/* Date Range */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <label className="flex flex-col">
                      <p className="pb-2 text-sm font-medium text-gray-700">Start Date</p>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </label>
                    <label className="flex flex-col">
                      <p className="pb-2 text-sm font-medium text-gray-700">End Date</p>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-base text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </label>
                  </div>

                  {/* Half Day Checkboxes */}
                  <div className="flex flex-wrap items-center gap-8">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-700">Half-day Start</p>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="start_am" className="h-4 w-4 rounded text-blue-500 focus:ring-blue-500/50" />
                        <label htmlFor="start_am" className="text-sm text-gray-700">AM</label>
                        <input type="checkbox" id="start_pm" className="h-4 w-4 rounded text-blue-500 focus:ring-blue-500/50" />
                        <label htmlFor="start_pm" className="text-sm text-gray-700">PM</label>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-700">Half-day End</p>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="end_am" className="h-4 w-4 rounded text-blue-500 focus:ring-blue-500/50" />
                        <label htmlFor="end_am" className="text-sm text-gray-700">AM</label>
                        <input type="checkbox" id="end_pm" className="h-4 w-4 rounded text-blue-500 focus:ring-blue-500/50" />
                        <label htmlFor="end_pm" className="text-sm text-gray-700">PM</label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Total Days: <span className="font-bold text-blue-500">2</span>
                    </p>
                  </div>

                  {/* Reason */}
                  <label className="flex flex-col">
                    <p className="pb-2 text-sm font-medium text-gray-700">Reason for Leave (Optional)</p>
                    <textarea
                      className="h-32 w-full resize-y rounded-lg border border-gray-300 bg-white p-4 text-base text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="Enter reason here..."
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
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">SVG, PNG, JPG or PDF (MAX. 5MB)</p>
                        </div>
                        <input id="dropzone-file" type="file" className="hidden" />
                      </label>
                    </div>
                  </label>
                </div>

                {/* Approval Info */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <h3 className="pb-4 text-lg font-semibold text-gray-900">Approval Information</h3>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <label className="flex flex-col">
                      <p className="pb-2 text-sm font-medium text-gray-700">Primary Approver</p>
                      <input
                        className="h-12 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 text-base text-gray-900"
                        disabled
                        value="John Doe"
                      />
                    </label>
                  </div>
                </div>
              </div>
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
                    <p className="text-sm font-medium text-gray-800">Annual Leave</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">Dates:</p>
                    <p className="text-sm font-medium text-gray-800">
                      {startDate} - {endDate}
                    </p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-sm text-gray-500">Total Days:</p>
                    <p className="text-lg font-bold text-gray-800">2</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col space-y-3 border-t border-gray-200 pt-6">
                  <button className="w-full rounded-lg bg-blue-500 px-4 py-2.5 font-semibold text-white transition-colors duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                    Submit Request
                  </button>
                  <button className="w-full rounded-lg bg-gray-200 px-4 py-2.5 font-semibold text-gray-800 transition-colors duration-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400/50">
                    Save as Draft
                  </button>
                  <button 
                    onClick={onCancel}
                    className="w-full rounded-lg px-4 py-2.5 font-semibold text-gray-500 transition-colors duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400/50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}