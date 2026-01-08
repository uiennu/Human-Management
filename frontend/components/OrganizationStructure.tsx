"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Edit2, Trash2, Eye, X, ChevronDown, ChevronUp, User, FileJson } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useAuth } from "@/lib/hooks/use-auth"

// --- IMPORT CÁC MODAL ---
import { AddDepartmentModal } from "@/components/add-department-modal"
import { DeleteDepartmentModal } from "@/components/delete-department-modal"
import { AddTeamModal } from "@/components/add-team-modal"
import { AddSubTeamModal } from "@/components/add-subteam-modal"
import { EditDepartmentModal } from "@/components/edit-department-modal"
import { EditTeamModal } from "@/components/edit-team-modal"
import { AddEmployeesModal } from "@/components/add-employees-modal"
import { MoveEmployeeModal } from "@/components/move-employee-modal"
import { RemoveEmployeeModal } from "@/components/remove-employee-modal"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { organizationService } from "@/lib/api/organization-service"

// --- INTERFACES ---
interface Department {
  id: string
  name: string
  code: string
  manager: string
  managerId: string
  description: string
  employees: Employee[]
  subdepartments?: Department[]
  departmentID?: number
  parentDepartmentName?: string
}

interface Employee {
  id: string
  name: string
  position: string
  avatar?: string
}

// --- DEPARTMENT CARD COMPONENT ---
const DepartmentCard = ({ dept, isRoot, level = 0, readOnly = false, onAddClick, onEditClick, onDeleteClick, onAddEmployeeClick, onDeleteEmployee, onDragStart, onDrop }: any) => {
  const [isEmployeesOpen, setIsEmployeesOpen] = useState(false)

  // Custom cursors
  const cursorGrabFinal = `url('/grab.png') 16 16, grab`
  const cursorPointerFinal = `url('/pointer.png') 10 0, pointer`

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div className="flex flex-col items-center z-10 relative" onDragOver={handleDragOver} onDrop={(e) => onDrop(e, dept, level)}>
      <div className="w-72 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            {/* INFO SECTION */}
            <div className="flex flex-col gap-1.5 flex-1 mr-2">
              <h3 className="font-bold text-gray-900 text-base leading-tight">{dept.name}</h3>
              {dept.manager && dept.manager !== "Chưa có quản lý" && dept.manager !== "Manager" && (
                <div className="flex items-center gap-1.5">
                  <div className="bg-blue-50 p-1 rounded-full"><User className="h-3 w-3 text-blue-600" /></div>
                  <span className="text-sm font-medium text-gray-700">{dept.manager}</span>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">Lead</span>
                </div>
              )}
              {dept.description && <p className="text-xs text-gray-400 line-clamp-2 mt-0.5" title={dept.description}>{dept.description}</p>}
            </div>

            {/* ACTION BUTTONS (EDIT/DELETE) - CHỈ HIỆN KHI KHÔNG READONLY */}
            {!isRoot && !readOnly && (
              <div className="flex gap-1 shrink-0">
                <button onClick={() => onEditClick(dept, level)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors" style={{ cursor: cursorPointerFinal }}>
                  <Edit2 className="h-4 w-4" />
                </button>
                <button onClick={() => onDeleteClick(dept)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" style={{ cursor: cursorPointerFinal }}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* EMPLOYEES TOGGLE */}
          {!isRoot && dept.employees.length > 0 && !isEmployeesOpen && (
            <div className="mt-3 pt-2 border-t border-gray-50">
              <button onClick={() => setIsEmployeesOpen(true)} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors focus:outline-none" style={{ cursor: cursorPointerFinal }}>
                <ChevronDown className="h-3 w-3" /> Show {dept.employees.length} Employees
              </button>
            </div>
          )}
        </div>

        {/* EMPLOYEES LIST */}
        {!isRoot && isEmployeesOpen && dept.employees.length > 0 && (
          <div className="px-4 pb-4 space-y-3">
            {dept.employees.map((emp: any) => (
              <div key={emp.id} draggable={!readOnly} onDragStart={(e) => !readOnly && onDragStart(e, emp, dept)} className="relative flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors" style={{ cursor: readOnly ? 'default' : cursorGrabFinal }}>
                <Avatar className="h-8 w-8 bg-gray-200">
                  <AvatarFallback className="text-xs text-gray-600 font-medium">{emp.name.split(" ").map((n: any) => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-700">{emp.name}</p>
                  <p className="text-[10px] text-gray-400">{emp.position}</p>
                </div>
                {!readOnly && (
                  <button onClick={() => onDeleteEmployee(dept.id, emp.id)} className="ml-auto p-1 text-gray-400 hover:text-red-500" style={{ cursor: cursorPointerFinal }}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            <div className="flex justify-center pt-2">
              <button onClick={() => setIsEmployeesOpen(false)} className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors focus:outline-none" style={{ cursor: cursorPointerFinal }}>
                <ChevronUp className="h-3 w-3" /> Close
              </button>
            </div>
          </div>
        )}

        {/* ADD BUTTONS (TEAM/EMPLOYEE) - CHỈ HIỆN KHI KHÔNG READONLY */}
        {!isRoot && !readOnly && (
          <div className="border-t border-gray-100 p-2 bg-gray-50/50">
            {level === 1 ? (
              <button onClick={() => onAddClick(dept, level)} className="w-full flex items-center justify-center gap-2 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" style={{ cursor: cursorPointerFinal }}>
                <Plus className="h-4 w-4" /> Add Team
              </button>
            ) : (
              <button onClick={() => onAddEmployeeClick(dept)} className="w-full flex items-center justify-center gap-2 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors" style={{ cursor: cursorPointerFinal }}>
                <Plus className="h-4 w-4" /> Add Employee
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// --- TREE NODE COMPONENT (RECURSIVE) ---
const TreeNode = (props: any) => {
  const { dept, level } = props
  const hasSubdepartments = dept.subdepartments && dept.subdepartments.length > 0;

  // Level 0: Horizontal layout
  if (level === 0) {
    return (
      <div className="flex flex-col items-center">
        <DepartmentCard {...props} />
        {hasSubdepartments && (
          <>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex pt-0">
              {dept.subdepartments.map((sub: any, index: number, arr: any[]) => (
                <div key={sub.id} className="relative px-6 pt-6">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-gray-300" />
                  {index > 0 && <div className="absolute top-0 left-0 w-1/2 h-px bg-gray-300" />}
                  {index < arr.length - 1 && <div className="absolute top-0 right-0 w-1/2 h-px bg-gray-300" />}
                  <TreeNode {...props} dept={sub} level={level + 1} isRoot={false} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Level 1+: Vertical layout
  return (
    <div className="flex flex-col items-center">
      <DepartmentCard {...props} />
      {hasSubdepartments && (
        <div className="relative flex flex-col items-center w-full">
          <div className="w-px h-8 bg-gray-300"></div>
          <div className="flex flex-col gap-6 pl-8 border-l border-gray-300 ml-8">
            {dept.subdepartments.map((sub: any) => (
              <div key={sub.id} className="relative">
                <div className="absolute top-10 -left-8 w-8 h-px bg-gray-300"></div>
                <TreeNode {...props} dept={sub} level={level + 1} isRoot={false} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN ORGANIZATION STRUCTURE COMPONENT ---
export function OrganizationStructure() {
  const { hasAnyRole } = useAuth()

  // LOGIC PHÂN QUYỀN: Chỉ Admin, HR mới được phép Add/Edit/Delete
  const canManageOrganization = hasAnyRole(['Admin', 'HR Manager', 'HR Employee'])

  // State Management
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false)
  const [addTeamModalOpen, setAddTeamModalOpen] = useState(false) // Giữ lại nếu cần dùng sau này
  const [addSubTeamModalOpen, setAddSubTeamModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editTeamModalOpen, setEditTeamModalOpen] = useState(false)
  const [addEmployeesModalOpen, setAddEmployeesModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // Selections
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null)
  const [parentDeptForAdd, setParentDeptForAdd] = useState<Department | null>(null)

  // Drag & Drop
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null)
  const [sourceDept, setSourceDept] = useState<Department | null>(null)
  const [targetDept, setTargetDept] = useState<Department | null>(null)

  // Remove Employee
  const [removeEmployeeModalOpen, setRemoveEmployeeModalOpen] = useState(false)
  const [employeeToRemove, setEmployeeToRemove] = useState<{ emp: Employee; dept: Department } | null>(null)

  // Zoom/Pan
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true)
      const [deptData, teamData, empData] = await Promise.all([
        organizationService.getAllDepartments(),
        organizationService.getAllTeams(),
        organizationService.getAllEmployees(),
      ])

      // Find Admin for Root Node
      const adminUser = empData.find((e: any) =>
        e.position === 'Admin' || e.Position === 'Admin' || e.roleName === 'Admin' || e.RoleName === 'Admin'
      );

      const rootNode: Department = {
        id: "root",
        name: "LeaveFlow Company",
        code: "ROOT",
        manager: adminUser ? adminUser.name : "System Admin",
        managerId: adminUser ? adminUser.employeeID.toString() : "",
        description: "Company root department.",
        employees: [],
        subdepartments: [],
      }

      const deptNodes: Department[] = deptData.map((d: any) => ({
        id: `dept-${d.departmentID}`,
        name: d.departmentName,
        code: d.departmentCode,
        manager: d.managerName || "Chưa có quản lý",
        managerId: d.ManagerId || d.managerId || d.ManagerID || "",
        description: d.Description || d.description || "",
        employees: [],
        subdepartments: [],
      }))

      teamData.forEach((team: any) => {
        const parentDept = deptNodes.find(d => d.id === `dept-${team.departmentID}`)
        if (parentDept) {
          const teamNode: Department = {
            id: `team-${team.subTeamID}`,
            name: team.teamName,
            code: `TEAM-${team.subTeamID}`,
            manager: team.teamLeadName || "Team Lead",
            managerId: team.teamLeadID?.toString() || "",
            description: team.description,
            departmentID: team.departmentID,
            parentDepartmentName: parentDept.name,
            employees: team.members
              .filter((m: any) => m.employeeID !== team.teamLeadID)
              .map((m: any) => ({
                id: m.employeeID.toString(),
                name: `${m.firstName} ${m.lastName}`,
                position: m.position || "Member",
                avatar: undefined
              })),
            subdepartments: []
          }
          parentDept.subdepartments?.push(teamNode)
        }
      })

      rootNode.subdepartments = deptNodes
      setDepartments([rootNode])
    } catch (error) {
      console.error("Failed to load organization structure", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // --- HANDLERS CHO ADD/DELETE/EDIT ---

  const handleAddClick = (dept: Department, level: number) => {
    setParentDeptForAdd(dept)
    // Level 0: Root -> Add Department
    // Level 1: Dept -> Add Team
    if (level === 0) setAddDeptModalOpen(true)
    else if (level === 1) setAddDeptModalOpen(true) // Reuse modal for team adding logic
    else setAddSubTeamModalOpen(true)
  }

  const showDeleteConfirmation = (dept: Department) => {
    setDeptToDelete(dept)
    setDeleteModalOpen(true)
  }

  // LOGIC DELETE QUAN TRỌNG: Gọi đúng API dựa trên ID Prefix
  const executeDeleteDepartment = async (idString: string) => {
    try {
      if (idString.startsWith("dept-")) {
        const id = parseInt(idString.replace("dept-", ""))
        await organizationService.deleteDepartment(id)
        toast.success("Department deleted successfully")
      } else if (idString.startsWith("team-")) {
        const id = parseInt(idString.replace("team-", ""))
        await organizationService.deleteTeam(id)
        toast.success("Team deleted successfully")
      } else {
        toast.error("Cannot delete Root")
        return
      }
      await fetchData()
      setDeleteModalOpen(false)
      setDeptToDelete(null)
    } catch (error: any) {
      console.error("Delete failed:", error)
      toast.error(error.message || "Failed to delete.")
    }
  }

  // --- CÁC HANDLER KHÁC (EDIT, MOVE, REMOVE EMPLOYEE...) ---
  const handleEditClick = (dept: Department, level: number = 0) => {
    setSelectedDept(dept)
    if (level === 0 || level === 1) setEditModalOpen(true)
    else setEditTeamModalOpen(true)
  }

  const handleEditDepartment = async (updated: any) => {
    if (!selectedDept) return

    try {
      // Determine if it's a department or team based on ID prefix
      if (selectedDept.id.startsWith("dept-")) {
        const deptId = parseInt(selectedDept.id.replace("dept-", ""))
        // Transform to API format
        const payload = {
          DepartmentName: updated.name,
          departmentCode: updated.code,
          description: updated.description,
          managerId: updated.managerId ? parseInt(updated.managerId) : null
        }
        await organizationService.updateDepartment(deptId, payload)
        toast.success("Department updated successfully")
      } else if (selectedDept.id.startsWith("team-")) {
        const teamId = parseInt(selectedDept.id.replace("team-", ""))
        // Transform to API format
        const payload = {
          teamName: updated.name,
          description: updated.description,
          teamLeadId: updated.managerId ? parseInt(updated.managerId) : null
        }
        await organizationService.updateTeam(teamId, payload)
        toast.success("Team updated successfully")
      } else {
        toast.error("Cannot update root department")
        return
      }

      setEditModalOpen(false)
      setEditTeamModalOpen(false)
      await fetchData()
    } catch (error: any) {
      console.error("Failed to update:", error)
      toast.error(error.message || "Failed to update")
    }
  }

  const handleAddEmployeeClick = (dept: Department) => {
    setSelectedDept(dept)
    setAddEmployeesModalOpen(true)
  }

  const handleDeleteEmployee = (deptId: string, empId: string) => {
    // Find the team/department
    const findDeptRecursive = (depts: Department[]): Department | null => {
      for (const dept of depts) {
        if (dept.id === deptId) return dept
        if (dept.subdepartments) {
          const found = findDeptRecursive(dept.subdepartments)
          if (found) return found
        }
      }
      return null
    }

    const dept = findDeptRecursive(departments)
    if (!dept) {
      toast.error("Team not found")
      return
    }

    const emp = dept.employees.find(e => e.id === empId)
    if (!emp) {
      toast.error("Employee not found")
      return
    }

    setEmployeeToRemove({ emp, dept })
    setRemoveEmployeeModalOpen(true)
  }

  const executeRemoveEmployee = async () => {
    if (!employeeToRemove) return

    try {
      // Extract team ID from dept.id (format: "team-123")
      const teamId = parseInt(employeeToRemove.dept.id.replace("team-", ""))
      const employeeId = parseInt(employeeToRemove.emp.id)

      await organizationService.removeEmployeeFromTeam(teamId, employeeId)
      toast.success("Employee removed from team successfully")
      await fetchData()
      setRemoveEmployeeModalOpen(false)
      setEmployeeToRemove(null)
    } catch (error: any) {
      console.error("Failed to remove employee:", error)
      toast.error(error.message || "Failed to remove employee")
    }
  }

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, employee: Employee, source: Department) => {
    setDraggedEmployee(employee)
    setSourceDept(source)
    e.dataTransfer.setData("text/plain", employee.id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDrop = (e: React.DragEvent, target: Department, targetLevel: number) => {
    e.preventDefault()
    if (!draggedEmployee || !sourceDept) return
    if (sourceDept.id === target.id) return
    if (targetLevel < 2) return // Only drop into Teams
    setTargetDept(target)
    setMoveModalOpen(true)
  }

  const confirmMoveEmployee = async () => {
    // 1. Kiểm tra an toàn
    if (!draggedEmployee || !targetDept) return;

    try {
      // 2. Xử lý ID nhân viên
      const empId = parseInt(draggedEmployee.id);

      // 3. Xử lý ID Team đích
      let targetTeamId = 0;
      if (targetDept.id.startsWith("team-")) {
        targetTeamId = parseInt(targetDept.id.replace("team-", ""));
      } else {
        // [EN] Only allow moving to a Team, not a Department
        toast.error("Employees can only be moved to a Team.");
        return;
      }

      // 4. Gọi API
      await organizationService.moveEmployee(empId, targetTeamId);

      // 5. Thông báo thành công
      // [EN] Success message with dynamic names
      toast.success(`Successfully moved ${draggedEmployee.name} to ${targetDept.name}`);

      // 6. Reset và reload
      setMoveModalOpen(false);
      setDraggedEmployee(null);
      setSourceDept(null);
      setTargetDept(null);
      
      await fetchData(); 

    } catch (error: any) {
      console.error("Move failed:", error);
      // [EN] Generic error message
      toast.error(error.message || "Failed to move employee.");
    }
  }

  // Zoom Handlers
  const handleZoomIn = () => setZoom(p => Math.min(p + 0.1, 2))
  const handleZoomOut = () => setZoom(p => Math.max(p - 0.1, 0.5))
  const handleResetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => { if (e.button === 0 || e.button === 1) { setIsPanning(true); setLastMousePos({ x: e.clientX, y: e.clientY }) } }
  const handleMouseMove = (e: React.MouseEvent) => { if (isPanning) { const dx = e.clientX - lastMousePos.x; const dy = e.clientY - lastMousePos.y; setPan(p => ({ x: p.x + dx, y: p.y + dy })); setLastMousePos({ x: e.clientX, y: e.clientY }) } }
  const handleMouseUp = () => setIsPanning(false)

  return (
    <div className="flex flex-col h-full gap-6 bg-gray-50/50 p-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Organization Structure</h1>
          <p className="text-muted-foreground mt-1">Visualize and manage your company's hierarchy.</p>
        </div>
        <div className="flex gap-2">
          {/* Zoom & Logs Controls */}
          <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm mr-2">
            <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100"><ChevronDown className="h-4 w-4" /></button>
            <span className="px-2 text-sm font-medium w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100"><ChevronUp className="h-4 w-4" /></button>
            <button onClick={handleResetZoom} className="p-2 hover:bg-gray-100 border-l border-gray-200"><Eye className="h-4 w-4" /></button>
          </div>

          {/* CHỈ ADMIN/HR MỚI ĐƯỢC XEM LOG */}
          {canManageOrganization && (
            <Button onClick={() => window.location.href = '/organization-logs'} variant="outline" className="shadow-sm">
              <FileJson className="mr-2 h-4 w-4" /> View Logs
            </Button>
          )}

          {/* ADD DEPARTMENT BUTTON - CHỈ HIỆN VỚI QUYỀN QUẢN LÝ */}
          {canManageOrganization && (
            <Button onClick={() => { setParentDeptForAdd(null); setAddDeptModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Add Department
            </Button>
          )}
        </div>
      </div>

      <div ref={containerRef} className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative touch-none"
        style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <div ref={contentRef} className="flex justify-center min-w-max pt-4 origin-top"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}>
          {departments.length > 0 && (
            <TreeNode
              dept={departments[0]}
              isRoot={true}
              level={0}
              // TRUYỀN READONLY XUỐNG CÂY NẾU KHÔNG CÓ QUYỀN
              readOnly={!canManageOrganization}
              onAddClick={handleAddClick}
              onEditClick={handleEditClick}
              onDeleteClick={showDeleteConfirmation}
              onAddEmployeeClick={handleAddEmployeeClick}
              onDeleteEmployee={handleDeleteEmployee}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          )}
        </div>
      </div>

      {/* --- MODALS --- */}
      <AddDepartmentModal
        open={addDeptModalOpen}
        onOpenChange={setAddDeptModalOpen}
        parentId={parentDeptForAdd?.id}
        parentName={parentDeptForAdd?.name}
        onSubmit={() => fetchData()}
      />

      {deptToDelete && (
        <DeleteDepartmentModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          departmentName={deptToDelete.name}
          onConfirm={() => executeDeleteDepartment(deptToDelete.id)}
          type={deptToDelete.id.startsWith("dept-") ? "Department" : "Team"}
        />
      )}

      {selectedDept && (
        <>
          <EditDepartmentModal open={editModalOpen} onOpenChange={setEditModalOpen} department={selectedDept} onSubmit={handleEditDepartment} />
          <EditTeamModal open={editTeamModalOpen} onOpenChange={setEditTeamModalOpen} department={selectedDept} onSubmit={handleEditDepartment} />
          <AddEmployeesModal open={addEmployeesModalOpen} onOpenChange={setAddEmployeesModalOpen} department={selectedDept} />
        </>
      )}

      {draggedEmployee && sourceDept && targetDept && (
        <MoveEmployeeModal
          open={moveModalOpen} onOpenChange={setMoveModalOpen}
          employeeName={draggedEmployee.name} sourceTeamName={sourceDept.name} targetTeamName={targetDept.name}
          onConfirm={confirmMoveEmployee}
        />
      )}

      {employeeToRemove && (
        <RemoveEmployeeModal
          open={removeEmployeeModalOpen} onOpenChange={setRemoveEmployeeModalOpen}
          employeeName={employeeToRemove.emp.name} teamName={employeeToRemove.dept.name}
          onConfirm={executeRemoveEmployee}
        />
      )}
    </div>
  )
}