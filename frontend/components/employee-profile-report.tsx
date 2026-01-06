"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Download, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
// Import Service
import { reportService, EmployeeReportFilter } from "@/lib/api/report-service";
import { toast } from "sonner";

interface Employee {
  employeeId: string 
  fullName: string   
  position: string
  hireDate: string
  status: "Active" | "On Leave" | "Terminated"
  department: string
}

const CONTRACT_STATUSES = ["Active", "On Leave", "Terminated"]

enum UserRole {
  Admin = "Admin",
  HRManager = "HR Manager",
  HREmployee = "HR Employee",
  BODAssistant = "BOD Assistant",
  ITManager = "IT Manager",
  SalesManager = "Sales Manager",
  FinanceManager = "Finance Manager",
  ITEmployee = "IT Employee",
  SalesEmployee = "Sales Employee",
  FinanceEmployee = "Finance Employee"
}

const DEPT_FILTER_ROLES = [UserRole.Admin, UserRole.HRManager, UserRole.HREmployee, UserRole.BODAssistant];
const TEAM_FILTER_ROLES = [...DEPT_FILTER_ROLES, UserRole.ITManager, UserRole.SalesManager, UserRole.FinanceManager];

export function EmployeeProfileReport() {
  const [department, setDepartment] = useState("All under me")
  const [subTeam, setSubTeam] = useState("All Teams")
  const [employeeSearch, setEmployeeSearch] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(["Active"])
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  
  const [reportGenerated, setReportGenerated] = useState(false)
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [totalRecords, setTotalRecords] = useState(0)
  const [summaryStats, setSummaryStats] = useState({
    total: 0, active: 0, onLeave: 0, terminated: 0
  })
  const [isExporting, setIsExporting] = useState(false);

  const [departmentOptions, setDepartmentOptions] = useState<string[]>(["All under me"])
  const [subTeamOptions, setSubTeamOptions] = useState<string[]>(["All Teams"])
  
  const { user } = useAuth() 
  const itemsPerPage = 5

  const realUserRole = user?.role || user?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || user?.['Role'];
  const canFilterDepartment = realUserRole && DEPT_FILTER_ROLES.includes(realUserRole as UserRole);
  const canFilterTeam = realUserRole && TEAM_FILTER_ROLES.includes(realUserRole as UserRole);

  // 1. Fetch Department
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!canFilterDepartment) return;
      try {
        const data = await reportService.getDepartments();
        setDepartmentOptions(["All under me", ...data]);
      } catch (error) {
        console.error("Failed to load departments", error);
      }
    };
    fetchDepartments();
  }, [canFilterDepartment]);

  // 2. Fetch SubTeams
  useEffect(() => {
    const fetchSubTeams = async () => {
      if (!canFilterTeam) return;
      try {
        const deptParam = (department && department !== "All under me") ? department : undefined;
        const data = await reportService.getSubTeams(deptParam);
        setSubTeamOptions(["All Teams", ...data]);
        setSubTeam("All Teams"); 
      } catch (error) {
        console.error("Failed to load subteams", error);
      }
    };
    fetchSubTeams();
  }, [canFilterTeam, department]);

  // 3. Auto fetch on pagination
  useEffect(() => {
    if (reportGenerated) {
      fetchReportData(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchReportData = async (pageToFetch: number) => {
    try {
      const filter: EmployeeReportFilter = {
        department: department,
        subTeam: subTeam,
        searchTerm: employeeSearch,
        hireDateFrom: dateFrom ? new Date(dateFrom) : undefined,
        hireDateTo: dateTo ? new Date(dateTo) : undefined,
        selectedStatuses: selectedStatuses,
        page: pageToFetch,
        pageSize: itemsPerPage 
      };

      const data = await reportService.getEmployeeReport(filter);

      setFilteredEmployees(data.data.items);
      setTotalPages(data.data.totalPages);
      setTotalRecords(data.data.totalItems);
      setSummaryStats({
        total: data.summary.totalEmployees,
        active: data.summary.activeCount,
        onLeave: data.summary.onLeaveCount,
        terminated: data.summary.terminatedCount
      });
    } catch (error) {
      console.error("Failed to fetch report", error);
      toast.error("Failed to fetch report data");
    }
  }

  const handleSearchClick = () => {
    setReportGenerated(true);
    setCurrentPage(1); 
    fetchReportData(1); 
  }

  const handleClearFilters = () => {
    setDepartment("All under me")
    setSubTeam("All Teams")
    setEmployeeSearch("")
    setSelectedStatuses(["Active"])
    setDateFrom("")
    setDateTo("")
    setReportGenerated(false)
    setCurrentPage(1)
    setFilteredEmployees([])
    setTotalRecords(0)
  }

  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]))
  }

  const handleExport = async (format: "excel" | "pdf") => {
    try {
      setIsExporting(true);
      toast.info(`Generating ${format.toUpperCase()} report...`);

      const currentFilter: EmployeeReportFilter = {
        department: department,
        subTeam: subTeam,
        searchTerm: employeeSearch,
        hireDateFrom: dateFrom ? new Date(dateFrom) : undefined,
        hireDateTo: dateTo ? new Date(dateTo) : undefined,
        selectedStatuses: selectedStatuses
      };

      await reportService.exportEmployeeReport(currentFilter, format);
      toast.success("Download started successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export report.");
    } finally {
      setIsExporting(false);
    }
  }

  // Calculate Chart Data
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

      {/* --- SUMMARY SECTION (Đã bổ sung đầy đủ) --- */}
      <Card className="bg-white">
        <CardHeader>
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            
            {/* 1. Total Employees (Trái) */}
            <div>
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-4xl font-bold text-foreground mt-1">{totalRecords}</p>
            </div>

            {/* 2. Chart & Legend (Giữa) */}
            <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
              {/* Donut Chart */}
              <div className="relative w-40 h-40 shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="8"
                    strokeDasharray={`${(activePercentage / 100) * 251.2} 251.2`} />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#eab308" strokeWidth="8"
                    strokeDasharray={`${(onLeavePercentage / 100) * 251.2} 251.2`}
                    strokeDashoffset={-((activePercentage / 100) * 251.2)} />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="8"
                    strokeDasharray={`${(terminatedPercentage / 100) * 251.2} 251.2`}
                    strokeDashoffset={-(((activePercentage + onLeavePercentage) / 100) * 251.2)} />
                </svg>
              </div>
              
              {/* Legend (Phần bị thiếu đã được thêm lại) */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Active</span><span className="font-semibold">{activePercentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>On Leave</span><span className="font-semibold">{onLeavePercentage}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Terminated</span><span className="font-semibold">{terminatedPercentage}%</span>
                </div>
              </div>
            </div>

            {/* 3. Active Filters (Phải - Phần bị thiếu đã được thêm lại) */}
            <div className="text-left md:text-right w-full md:w-auto">
              <p className="text-xs text-muted-foreground mb-2">Active Filters:</p>
              <div className="flex gap-2 flex-wrap md:justify-end">
                <Badge variant="secondary" className="bg-gray-100">{department}</Badge>
                {subTeam !== "All Teams" && <Badge variant="secondary" className="bg-blue-100">{subTeam}</Badge>}
                {selectedStatuses.map((status) => (
                  <Badge key={status} className={`${
                        status === "Active" ? "bg-green-100 text-green-700" :
                        status === "On Leave" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                    Status: {status}
                  </Badge>
                ))}
              </div>
            </div>

          </div>
        </CardHeader>
      </Card>

      {/* --- FILTERS SECTION --- */}
      <Card className="bg-white">
        <CardHeader><h3 className="font-semibold">Filters</h3></CardHeader>
        <CardContent className="space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {/* Department */}
                {canFilterDepartment ? (
                    <div>
                    <label className="text-xs font-medium text-foreground">Department</label>
                    <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full mt-2 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground">
                        {departmentOptions.map((dept) => (<option key={dept} value={dept}>{dept}</option>))}
                    </select>
                    </div>
                ) : (
                    <div><label className="text-xs font-medium text-foreground">Department</label><Input value="All under me" disabled className="mt-2 bg-gray-100 text-gray-500 cursor-not-allowed" /></div>
                )}
                {/* SubTeam */}
                {canFilterTeam && (
                    <div>
                    <label className="text-xs font-medium text-foreground">Team</label>
                    <select value={subTeam} onChange={(e) => setSubTeam(e.target.value)} className="w-full mt-2 px-3 py-2 text-sm border border-border rounded-md bg-background text-foreground">
                        {subTeamOptions.map((t) => (<option key={t} value={t}>{t}</option>))}
                    </select>
                    </div>
                )}
                {/* Search */}
                <div><label className="text-xs font-medium text-foreground">Employee</label><div className="mt-2 relative"><Input placeholder="Search by name/ID..." value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} className="text-sm" /></div></div>
                {/* Date */}
                <div className="min-w-0"><label className="text-xs font-medium text-foreground">Hire Date Range</label><div className="flex gap-2 mt-2"><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full min-w-0 px-2 py-2 text-sm border border-border rounded-md bg-background text-foreground" /><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full min-w-0 px-2 py-2 text-sm border border-border rounded-md bg-background text-foreground" /></div></div>
                {/* Status */}
                <div className="min-w-0"><label className="text-xs font-medium text-foreground">Contract Status</label><div className="flex gap-2 mt-2 flex-wrap">
                    {CONTRACT_STATUSES.map((status) => {
                        const isSelected = selectedStatuses.includes(status)
                        return (
                        <Badge key={status} variant="outline" onClick={() => toggleStatus(status)} className={`cursor-pointer text-xs px-3 py-1 h-7 rounded-full border transition-all flex items-center gap-2 whitespace-nowrap ${isSelected ? (status === "Active" ? "bg-green-100 text-green-700 border-green-200" : status === "On Leave" ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-red-100 text-red-700 border-red-200") : "bg-background text-muted-foreground"}`}><div className={`w-2 h-2 rounded-full shrink-0 ${isSelected ? (status === "Active" ? "bg-green-600" : status === "On Leave" ? "bg-yellow-500" : "bg-red-600") : "bg-muted-foreground/30"}`} />{status}</Badge>
                        )
                    })}
                </div></div>
           </div>
           <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={handleClearFilters} className="text-sm bg-transparent">Clear Filters</Button>
                <Button onClick={handleSearchClick} className="bg-blue-600 hover:bg-blue-700 text-sm">Generate Report</Button>
           </div>
        </CardContent>
      </Card>

      {/* --- REPORT TABLE SECTION --- */}
      {reportGenerated && (
        <Card className="bg-white">
          <CardContent className="pt-6">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-8"><p className="text-muted-foreground">No data available for the selected criteria.</p></div>
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
                      {filteredEmployees.map((emp) => (
                        <tr key={emp.employeeId} className="border-b border-border hover:bg-muted/50">
                          <td className="py-4 px-4 text-foreground">{emp.fullName}</td>
                          <td className="py-4 px-4 text-foreground">{emp.employeeId}</td>
                          <td className="py-4 px-4 text-foreground">{emp.position}</td>
                          <td className="py-4 px-4 text-foreground">{new Date(emp.hireDate).toLocaleDateString('en-US')}</td>
                          <td className="py-4 px-4">
                            <Badge variant="outline" className={`text-xs px-3 py-1 rounded-full border-0 flex w-fit items-center gap-2 ${emp.status === "Active" ? "bg-green-100 text-green-700" : emp.status === "On Leave" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                              <div className={`w-2 h-2 rounded-full ${emp.status === "Active" ? "bg-green-600" : emp.status === "On Leave" ? "bg-yellow-500" : "bg-red-600"}`} />
                              {emp.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination & Export */}
                <div className="flex flex-col md:flex-row gap-3 mt-6 items-center justify-between">
                  <div className="flex gap-3">
                    <Button onClick={() => handleExport("excel")} disabled={isExporting} className="bg-green-600 hover:bg-green-700 text-white text-sm">
                      <Download className="w-4 h-4 mr-2" /> {isExporting ? "Exporting..." : "Download CSV"}
                    </Button>
                    <Button onClick={() => handleExport("pdf")} disabled={isExporting} className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                      <FileText className="w-4 h-4 mr-2" /> {isExporting ? "Exporting..." : "Download PDF"}
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mt-4 md:mt-0">
                    <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages || totalPages === 0}><ChevronRight className="w-4 h-4" /></Button>
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