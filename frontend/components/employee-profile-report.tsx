"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Download, FileText, Eye, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"

interface Employee {
  id: string
  name: string
  position: string
  hireDate: string
  status: "Active" | "On Leave" | "Terminated"
  department: string
}

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "EMP001",
    name: "Olivia Chen",
    position: "Frontend Dev",
    hireDate: "15/03/2023",
    status: "Active",
    department: "Engineering",
  },
  {
    id: "EMP002",
    name: "Ben Carter",
    position: "Backend Dev",
    hireDate: "10/05/2022",
    status: "Active",
    department: "Engineering",
  },
  {
    id: "EMP003",
    name: "Isabella Rossi",
    position: "Product Manager",
    hireDate: "20/09/2021",
    status: "On Leave",
    department: "Product",
  },
  {
    id: "EMP004",
    name: "Liam Goldberg",
    position: "UI/UX Designer",
    hireDate: "01/11/2022",
    status: "Active",
    department: "Product",
  },
  {
    id: "EMP005",
    name: "Noah Kim",
    position: "DevOps Engineer",
    hireDate: "18/07/2020",
    status: "Terminated",
    department: "Engineering",
  },
  {
    id: "EMP006",
    name: "Emma Johnson",
    position: "HR Manager",
    hireDate: "12/01/2021",
    status: "Active",
    department: "Human Resources",
  },
  {
    id: "EMP007",
    name: "David Lee",
    position: "Product Lead",
    hireDate: "05/06/2021",
    status: "Active",
    department: "Product",
  },
  {
    id: "EMP008",
    name: "Sarah Chen",
    position: "QA Engineer",
    hireDate: "22/02/2023",
    status: "Active",
    department: "Engineering",
  },
]

const DEPARTMENTS = ["All under me", "Engineering", "Product", "Human Resources"]
const CONTRACT_STATUSES = ["Active", "On Leave", "Terminated"]

export function EmployeeProfileReport() {
  const [department, setDepartment] = useState("All under me")
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Active"])
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [reportGenerated, setReportGenerated] = useState(false)
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [summaryStats, setSummaryStats] = useState({
    total: 0,
    active: 0,
    onLeave: 0,
    terminated: 0
  })
  const { token } = useAuth();
  const itemsPerPage = 5

  const handleGenerateReport = async () => {
    // Chuẩn bị payload gửi lên API
    const payload = {
      department: department,
      searchTerm: employeeSearch,
      hireDateFrom: dateFrom || null,
      hireDateTo: dateTo || null,
      selectedStatuses: selectedStatuses,
      page: currentPage,
      pageSize: 5 // Hoặc itemsPerPage
    };

    

    try {
      // Gọi API (Thay URL bằng port thực tế của backend bạn, ví dụ localhost:5000)
      const response = await fetch('http://localhost:5204/api/reports/employees', { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Nếu có token thì bỏ comment dòng này
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("API Call Failed");

      const data = await response.json();

      // Cập nhật dữ liệu vào bảng
      setFilteredEmployees(data.data.items);
      
      // 1. SỬA LỖI 1: Cập nhật số trang từ Server
      setTotalPages(data.data.totalPages);

      // 2. SỬA LỖI 2: Cập nhật số liệu thống kê cho biểu đồ
      // (Thay thế cho dòng updateChart(data.summary) bị lỗi)
      setSummaryStats({
        total: data.summary.totalEmployees,
        active: data.summary.activeCount,
        onLeave: data.summary.onLeaveCount,
        terminated: data.summary.terminatedCount
      });

      setReportGenerated(true);
    } catch (error) {
      console.error("Failed to fetch report", error);
    }
  }

  const handleClearFilters = () => {
    setDepartment("All under me")
    setEmployeeSearch("")
    setSelectedStatuses(["Active"])
    setDateFrom("")
    setDateTo("")
    setReportGenerated(false)
    setCurrentPage(1)
  }

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const handleExport = (format: "excel" | "pdf") => {
    alert(`Report exported as ${format.toUpperCase()} successfully!`)
  }

  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage)

  const totalForChart = summaryStats.total > 0 ? summaryStats.total : 1; 

  const activePercentage = Math.round((summaryStats.active / totalForChart) * 100);
  const onLeavePercentage = Math.round((summaryStats.onLeave / totalForChart) * 100);
  const terminatedPercentage = Math.round((summaryStats.terminated / totalForChart) * 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Employee Profile Report</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate reports for employees under your management.</p>
      </div>

      {/* Summary Section */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-4xl font-bold text-foreground mt-1">{MOCK_EMPLOYEES.length}</p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
              {/* Donut Chart */}
              <div className="relative w-40 h-40 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="8"
                    strokeDasharray={`${(activePercentage / 100) * 251.2} 251.2`}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="8"
                    strokeDasharray={`${(onLeavePercentage / 100) * 251.2} 251.2`}
                    strokeDashoffset={-((activePercentage / 100) * 251.2)}
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="8"
                    strokeDasharray={`${(terminatedPercentage / 100) * 251.2} 251.2`}
                    strokeDashoffset={-(((activePercentage + onLeavePercentage) / 100) * 251.2)}
                  />
                </svg>
              </div>
              {/* Legend */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Active</span>
                  <span className="font-semibold">{activePercentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>On Leave</span>
                  <span className="font-semibold">{onLeavePercentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Terminated</span>
                  <span className="font-semibold">{terminatedPercentage}%</span>
                </div>
              </div>
            </div>
            {/* Active Filters */}
            <div className="text-left md:text-right w-full md:w-auto">
              <p className="text-xs text-muted-foreground mb-2">Active Filters:</p>
              <div className="flex gap-2 flex-wrap md:justify-end">
                <Badge variant="secondary" className="bg-gray-100">
                  {department}
                </Badge>
                {selectedStatuses.map((status) => (
                  <Badge
                    key={status}
                    className={`
                      ${
                        status === "Active"
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : status === "On Leave"
                            ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                  >
                    Status: {status}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters Section */}
      <Card className="bg-white">
        <CardHeader>
          <h3 className="font-semibold">Filters</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ĐÃ SỬA: Thay grid-cols-4 thành responsive: 
            - Màn hình nhỏ: 1 cột
            - Màn hình vừa (md): 2 cột
            - Màn hình lớn (xl): 4 cột
            Điều này giúp các ô input không bị đè lên nhau.
          */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div>
              <label className="text-xs font-medium text-foreground">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full mt-2 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Employee</label>
              <div className="mt-2 relative">
                <Input
                  placeholder="Search by name/ID..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="text-xs font-medium text-foreground">Hire Date Range</label>
              <div className="flex gap-2 mt-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  placeholder="From"
                  className="w-full min-w-0 px-2 py-2 text-sm border border-border rounded-md bg-background text-foreground"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  placeholder="To"
                  className="w-full min-w-0 px-2 py-2 text-sm border border-border rounded-md bg-background text-foreground"
                />
              </div>
            </div>

            <div className="min-w-0">
              <label className="text-xs font-medium text-foreground">Contract Status</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {CONTRACT_STATUSES.map((status) => {
                  const isSelected = selectedStatuses.includes(status)
                  let colorStyles = ""
                  let dotColor = ""

                  // Logic xác định màu sắc dựa trên status
                  switch (status) {
                    case "Active":
                      colorStyles = "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                      dotColor = "bg-green-600"
                      break
                    case "On Leave":
                      colorStyles = "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200"
                      dotColor = "bg-yellow-500"
                      break
                    case "Terminated":
                      colorStyles = "bg-red-100 text-red-700 border-red-200 hover:bg-red-200"
                      dotColor = "bg-red-600"
                      break
                    default:
                      break
                  }

                  return (
                    <Badge
                      key={status}
                      variant="outline"
                      onClick={() => toggleStatus(status)}
                      className={`cursor-pointer text-xs px-3 py-1 h-7 rounded-full border transition-all flex items-center gap-2 whitespace-nowrap ${
                        isSelected
                          ? colorStyles
                          : "bg-background text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? dotColor : "bg-muted-foreground/30"}`}
                      />
                      {status}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClearFilters} className="text-sm bg-transparent">
              Clear Filters
            </Button>
            <Button onClick={handleGenerateReport} className="bg-blue-600 hover:bg-blue-700 text-sm">
              Generate Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      {reportGenerated && (
        <Card className="bg-white">
          <CardContent className="pt-6">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No data available for the selected criteria.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-4 px-4 font-semibold text-foreground">Full Name</th>
                        <th className="text-left py-4 px-4 font-semibold text-foreground">Employee ID</th>
                        <th className="text-left py-4 px-4 font-semibold text-foreground">Position</th>
                        <th className="text-left py-4 px-4 font-semibold text-foreground">Hire Date</th>
                        <th className="text-left py-4 px-4 font-semibold text-foreground">Contract Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEmployees.map((emp: any) => (
                        <tr key={emp.employeeId} className="border-b border-border hover:bg-muted/50">
                          <td className="py-4 px-4 text-foreground">{emp.fullName}</td>
                          <td className="py-4 px-4 text-foreground">{emp.employeeId}</td>
                          <td className="py-4 px-4 text-foreground">{emp.position}</td>
                          <td className="py-4 px-4 text-foreground">
                              {new Date(emp.hireDate).toLocaleDateString('en-US')}
                          </td>
                          <td className="py-4 px-4">
                            <Badge
                              variant="outline"
                              className={`text-xs px-3 py-1 rounded-full border-0 flex w-fit items-center gap-2 ${
                                emp.status === "Active"
                                  ? "bg-green-100 text-green-700"
                                  : emp.status === "On Leave"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  emp.status === "Active"
                                    ? "bg-green-600"
                                    : emp.status === "On Leave"
                                      ? "bg-yellow-500"
                                      : "bg-red-600"
                                }`}
                              />
                              {emp.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Export and Pagination */}
                <div className="flex flex-col md:flex-row gap-3 mt-6 items-center justify-between">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleExport("excel")}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Excel
                    </Button>
                    <Button
                      onClick={() => handleExport("pdf")}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button variant="outline" className="text-sm bg-transparent">
                      <Eye className="w-4 h-4 mr-2" />
                      Preview PDF
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <span className="text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}