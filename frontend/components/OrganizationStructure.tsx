"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Edit2, Trash2, Users, Eye, X, ChevronDown, ChevronUp, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// --- IMPORT CÁC MODAL ---
import { AddDepartmentModal } from "@/components/add-department-modal"
import { DeleteDepartmentModal } from "@/components/delete-department-modal"
import { AddTeamModal } from "@/components/add-team-modal"
import { AddSubTeamModal } from "@/components/add-subteam-modal"
import { EditDepartmentModal } from "@/components/edit-department-modal"
import { EditTeamModal } from "@/components/edit-team-modal"
import { AddEmployeesModal } from "@/components/add-employees-modal"
import { MoveEmployeeModal } from "@/components/move-employee-modal"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { organizationService } from "@/lib/api/organization-service"

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

// --- PROPS INTERFACES ---
interface DepartmentCardProps {
  dept: Department
  isRoot?: boolean
  level?: number
  readOnly?: boolean // <--- Thêm prop này để chặn sửa xóa
  onAddClick: (dept: Department, level: number) => void
  onEditClick: (dept: Department, level: number) => void
  onDeleteClick: (dept: Department) => void
  onAddEmployeeClick: (dept: Department) => void
  onDeleteEmployee: (deptId: string, empId: string) => void
  onDragStart: (e: React.DragEvent, employee: Employee, sourceDept: Department) => void
  onDrop: (e: React.DragEvent, targetDept: Department, level: number) => void
}

interface TreeNodeProps {
  dept: Department
  isRoot?: boolean
  level?: number
  readOnly?: boolean // <--- Thêm prop này để truyền xuống con
  onAddClick: (dept: Department, level: number) => void
  onEditClick: (dept: Department, level: number) => void
  onDeleteClick: (dept: Department) => void
  onAddEmployeeClick: (dept: Department) => void
  onDeleteEmployee: (deptId: string, empId: string) => void
  onDragStart: (e: React.DragEvent, employee: Employee, sourceDept: Department) => void
  onDrop: (e: React.DragEvent, targetDept: Department, level: number) => void
}

// --- EXTRACTED COMPONENTS ---

// Custom Image Cursors
const cursorGrabFinal = `url('/grab.png') 16 16, grab`
const cursorGrabbingFinal = `url('/grabbing.png') 16 16, grabbing`
const cursorPointerFinal = `url('/pointer.png') 10 0, pointer`

const DepartmentCard = ({
  dept,
  isRoot,
  level = 0,
  readOnly = false, // Mặc định cho phép sửa
  onAddClick,
  onEditClick,
  onDeleteClick,
  onAddEmployeeClick,
  onDeleteEmployee,
  onDragStart,
  onDrop
}: DepartmentCardProps) => {
  const [isEmployeesOpen, setIsEmployeesOpen] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  return (
    <div
      className="flex flex-col items-center z-10 relative"
      onDragOver={handleDragOver}
      onDrop={(e) => onDrop(e, dept, level)}
    >
      <div className="w-72 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">

            {/* --- GIAO DIỆN HIỂN THỊ THÔNG TIN --- */}
            <div className="flex flex-col gap-1.5 flex-1 mr-2">
              <h3 className="font-bold text-gray-900 text-base leading-tight">{dept.name}</h3>

              {dept.manager && dept.manager !== "Chưa có quản lý" && dept.manager !== "Manager" && (
                <div className="flex items-center gap-1.5">
                  <div className="bg-blue-50 p-1 rounded-full">
                    <User className="h-3 w-3 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{dept.manager}</span>
                  <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                    Lead
                  </span>
                </div>
              )}

              {dept.description && (
                <p className="text-xs text-gray-400 line-clamp-2 mt-0.5" title={dept.description}>
                  {dept.description}
                </p>
              )}
            </div>

            {/* --- NÚT SỬA / XÓA (Ẩn nếu là Root hoặc ReadOnly) --- */}
            {!isRoot && !readOnly && (
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => onEditClick(dept, level)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  style={{ cursor: cursorPointerFinal }}
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeleteClick(dept)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  style={{ cursor: cursorPointerFinal }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {/* TOGGLE BUTTON (SHOW EMPLOYEES) */}
          {!isRoot && dept.employees.length > 0 && !isEmployeesOpen && (
            <div className="mt-3 pt-2 border-t border-gray-50">
              <button
                onClick={() => setIsEmployeesOpen(true)}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors focus:outline-none"
                style={{ cursor: cursorPointerFinal }}
              >
                <ChevronDown className="h-3 w-3" />
                Show {dept.employees.length} Employees
              </button>
            </div>
          )}
        </div>

        {/* DANH SÁCH NHÂN VIÊN */}
        {!isRoot && isEmployeesOpen && dept.employees.length > 0 && (
          <div className="px-4 pb-4 space-y-3">
            {dept.employees.map((emp) => (
              <div
                key={emp.id}
                draggable={!readOnly} // Nếu readOnly thì không cho kéo thả
                onDragStart={(e) => !readOnly && onDragStart(e, emp, dept)}
                className="relative flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ cursor: readOnly ? 'default' : cursorGrabFinal }}
              >
                <Avatar className="h-8 w-8 bg-gray-200">
                  <AvatarFallback className="text-xs text-gray-600 font-medium">
                    {emp.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
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
              <button
                onClick={() => setIsEmployeesOpen(false)}
                className="flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-700 transition-colors focus:outline-none"
                style={{ cursor: cursorPointerFinal }}
              >
                <ChevronUp className="h-3 w-3" />
                Close
              </button>
            </div>
          </div>
        )}

        {/* NÚT THÊM TEAM / NHÂN VIÊN (Ẩn nếu ReadOnly) */}
        {!isRoot && !readOnly && (
          <div className="border-t border-gray-100 p-2 bg-gray-50/50">
            {level === 1 ? (
              <button
                onClick={() => onAddClick(dept, level)}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                style={{ cursor: cursorPointerFinal }}
              >
                <Plus className="h-4 w-4" />
                Add Team
              </button>
            ) : (
              <button
                onClick={() => onAddEmployeeClick(dept)}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                style={{ cursor: cursorPointerFinal }}
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const TreeNode = ({
  dept,
  isRoot = false,
  level = 0,
  readOnly = false,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onAddEmployeeClick,
  onDeleteEmployee,
  onDragStart,
  onDrop
}: TreeNodeProps) => {
  const hasSubdepartments = dept.subdepartments && dept.subdepartments.length > 0;

  // LEVEL 0: ROOT -> DEPARTMENTS (HORIZONTAL LAYOUT)
  if (level === 0) {
    return (
      <div className="flex flex-col items-center">
        <DepartmentCard
          dept={dept}
          isRoot={isRoot}
          level={level}
          readOnly={readOnly}
          onAddClick={onAddClick}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
          onAddEmployeeClick={onAddEmployeeClick}
          onDeleteEmployee={onDeleteEmployee}
          onDragStart={onDragStart}
          onDrop={onDrop}
        />

        {hasSubdepartments && (
          <>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex pt-0">
              {dept.subdepartments!.map((sub, index, arr) => (
                <div key={sub.id} className="relative px-6 pt-6">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-gray-300" />
                  {index > 0 && <div className="absolute top-0 left-0 w-1/2 h-px bg-gray-300" />}
                  {index < arr.length - 1 && <div className="absolute top-0 right-0 w-1/2 h-px bg-gray-300" />}
                  <TreeNode
                    dept={sub}
                    isRoot={false}
                    level={level + 1}
                    readOnly={readOnly}
                    onAddClick={onAddClick}
                    onEditClick={onEditClick}
                    onDeleteClick={onDeleteClick}
                    onAddEmployeeClick={onAddEmployeeClick}
                    onDeleteEmployee={onDeleteEmployee}
                    onDragStart={onDragStart}
                    onDrop={onDrop}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // LEVEL 1+: DEPARTMENTS -> TeamS (VERTICAL LAYOUT)
  return (
    <div className="flex flex-col items-center">
      <DepartmentCard
        dept={dept}
        isRoot={isRoot}
        level={level}
        readOnly={readOnly}
        onAddClick={onAddClick}
        onEditClick={onEditClick}
        onDeleteClick={onDeleteClick}
        onAddEmployeeClick={onAddEmployeeClick}
        onDeleteEmployee={onDeleteEmployee}
        onDragStart={onDragStart}
        onDrop={onDrop}
      />

      {hasSubdepartments && (
        <div className="relative flex flex-col items-center w-full">
          <div className="w-px h-8 bg-gray-300"></div>
          <div className="flex flex-col gap-6 pl-8 border-l border-gray-300 ml-8">
            {dept.subdepartments!.map((sub) => (
              <div key={sub.id} className="relative">
                <div className="absolute top-10 -left-8 w-8 h-px bg-gray-300"></div>
                <TreeNode
                  dept={sub}
                  isRoot={false}
                  level={level + 1}
                  readOnly={readOnly}
                  onAddClick={onAddClick}
                  onEditClick={onEditClick}
                  onDeleteClick={onDeleteClick}
                  onAddEmployeeClick={onAddEmployeeClick}
                  onDeleteEmployee={onDeleteEmployee}
                  onDragStart={onDragStart}
                  onDrop={onDrop}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export function OrganizationStructure() {
  // --- STATE QUẢN LÝ DỮ LIỆU ---
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  // --- GIẢ LẬP QUYỀN TRUY CẬP (ROLE) ---
  // 5 = Admin, 3 = HR Manager, 4 = HR Employee, 10 = BOD Assistant
  // Nếu bạn đổi số này thành 1 (IT Employee) -> Màn hình sẽ chuyển sang chế độ Chỉ Xem
  const currentUserRoleId = 5; 
  const ALLOWED_ROLES = [3, 4, 5, 10];
  const isReadOnly = !ALLOWED_ROLES.includes(currentUserRoleId);

  // --- FETCH DATA FROM API ---
  const fetchData = async () => {
    try {
      setLoading(true)
      const [deptData, teamData, empData] = await Promise.all([
        organizationService.getAllDepartments(),
        organizationService.getAllTeams(),
        organizationService.getAllEmployees(),
      ])

      // 1. Create Root Node
      const rootNode: Department = {
        id: "root",
        name: "Human Resource Management",
        code: "ROOT",
        manager: "CEO",
        managerId: "ceo-001",
        description: "Organization Root",
        employees: [],
        subdepartments: [],
      }

      // 2. Map Departments to Nodes (Level 1)
      const deptNodes: Department[] = deptData.map((d: any) => ({
        id: `dept-${d.departmentID}`,
        name: d.departmentName,
        code: d.departmentCode,
        manager: d.managerName || "Chưa có quản lý",
        managerId: "",
        description: "Department Manager",
        employees: [],
        subdepartments: [],
      }))

      // 3. Map Teams to Nodes (Level 2) and attach to Departments
      teamData.forEach(team => {
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
            employees: team.members.map(m => ({
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

  useEffect(() => {
    fetchData()
  }, [])


  // --- STATE QUẢN LÝ 3 LOẠI MODAL ---
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false)
  const [addTeamModalOpen, setAddTeamModalOpen] = useState(false)
  const [addSubTeamModalOpen, setAddSubTeamModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editTeamModalOpen, setEditTeamModalOpen] = useState(false)
  const [addEmployeesModalOpen, setAddEmployeesModalOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null)

  // Drag and Drop State
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null)
  const [sourceDept, setSourceDept] = useState<Department | null>(null)
  const [targetDept, setTargetDept] = useState<Department | null>(null)
  const [parentDeptForAdd, setParentDeptForAdd] = useState<Department | null>(null)

  // --- HANDLER CHUNG ---
  const handleAddEntity = async (data: any) => {
      // Logic giả lập, sau này bạn có thể gọi API Create ở đây
      toast.info("Create feature coming soon with API integration")
      setAddDeptModalOpen(false)
      setAddTeamModalOpen(false)
      setAddSubTeamModalOpen(false)
      setParentDeptForAdd(null)
  }

  // --- HÀM UPDATE DEPARTMENT ---
  const handleEditDepartment = async (updated: Omit<Department, "employees" | "subdepartments">) => {
    try {
      if (updated.id.startsWith("dept-")) {
        // 1. Lấy ID thật (số)
        const realId = parseInt(updated.id.replace("dept-", ""));

        // 2. Map dữ liệu sang DTO Backend
        const payload = {
          DepartmentName: updated.name,
          DepartmentCode: updated.code,
          Description: updated.description,
          ManagerID: updated.managerId ? parseInt(updated.managerId) : null
        };

        // 3. Gọi API
        await organizationService.updateDepartment(realId, payload);
        toast.success("Department updated successfully");

        // 4. Load lại dữ liệu
        await fetchData();

      } else if (updated.id.startsWith("team-")) {
        // Logic cho Team nếu có API
        toast.info("Update Team feature is coming soon");
      }

      setEditModalOpen(false);
      setEditTeamModalOpen(false);
      setSelectedDept(null);

    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update department");
    }
  }

  // --- HÀM DELETE DEPARTMENT ---
  const showDeleteConfirmation = (dept: Department) => {
    setDeptToDelete(dept)
    setDeleteModalOpen(true)
  }

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

  const handleDeleteEmployee = (deptId: string, empId: string) => {
      // Logic xóa nhân viên khỏi team (Cần API)
      toast.info("Remove Employee feature coming soon")
  }

  // --- DRAG AND DROP HANDLERS ---
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
    if (targetLevel < 2) {
      console.warn("Cannot drop employee into a Department. Must be a Team.")
      return
    }
    setTargetDept(target)
    setMoveModalOpen(true)
  }

  const confirmMoveEmployee = () => {
    toast.info("Move Employee feature coming soon with API integration")
    setMoveModalOpen(false)
  }

  // --- ZOOM & PAN STATE ---
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 2))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5))
  const handleResetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }) }

  const clampPan = (newPan: { x: number; y: number }, currentZoom: number) => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return newPan
    const containerRect = container.getBoundingClientRect()
    const contentW = content.offsetWidth
    const contentH = content.offsetHeight
    const minX = 50 - (contentW * (1 + currentZoom)) / 2
    const maxX = containerRect.width - 50 - (contentW * (1 - currentZoom)) / 2
    const minY = 50 - (contentH * currentZoom)
    const maxY = containerRect.height - 50
    return {
      x: Math.min(Math.max(newPan.x, minX), maxX),
      y: Math.min(Math.max(newPan.y, minY), maxY)
    }
  }

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey) {
        const delta = e.deltaY * -0.001
        setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 2))
      } else {
        setPan((prev) => {
          const newPan = { x: prev.x - e.deltaX, y: prev.y - e.deltaY }
          return clampPan(newPan, zoom)
        })
      }
    }
    container.addEventListener("wheel", onWheel, { passive: false })
    return () => { container.removeEventListener("wheel", onWheel) }
  }, [zoom])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastMousePos.x
      const deltaY = e.clientY - lastMousePos.y
      setPan((prev) => clampPan({ x: prev.x + deltaX, y: prev.y + deltaY }, zoom))
      setLastMousePos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => { setIsPanning(false) }

  // --- ACTION HANDLERS ---
  const handleAddClick = (dept: Department, level: number) => {
    setParentDeptForAdd(dept)
    if (level === 0) setAddDeptModalOpen(true)
    else if (level === 1) setAddDeptModalOpen(true)
    else setAddSubTeamModalOpen(true)
  }

  const handleEditClick = (dept: Department, level: number = 0) => {
    setSelectedDept(dept)
    if (level === 0 || level === 1) setEditModalOpen(true)
    else setEditTeamModalOpen(true)
  }

  const handleAddEmployeeClick = (dept: Department) => {
    setSelectedDept(dept)
    setAddEmployeesModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full gap-6 bg-gray-50/50 p-6 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Organization Structure</h1>
          <p className="text-muted-foreground mt-1">Visualize and manage your company's hierarchy.</p>
        </div>
        <div className="flex gap-2">
          {/* ZOOM CONTROLS */}
          <div className="flex items-center bg-white border border-gray-200 rounded-md shadow-sm mr-2">
            <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 text-gray-600 rounded-l-md" style={{ cursor: cursorPointerFinal }}><ChevronDown className="h-4 w-4" /></button>
            <span className="px-2 text-sm font-medium text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 text-gray-600 rounded-r-md" style={{ cursor: cursorPointerFinal }}><ChevronUp className="h-4 w-4" /></button>
            <button onClick={handleResetZoom} className="p-2 hover:bg-gray-100 text-gray-600 border-l border-gray-200" style={{ cursor: cursorPointerFinal }}><Eye className="h-4 w-4" /></button>
          </div>

          {!isReadOnly && (
            <Button
              onClick={() => { setParentDeptForAdd(null); setAddDeptModalOpen(true); }}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              style={{ cursor: cursorPointerFinal }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Department
            </Button>
          )}
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative touch-none"
        style={{ cursor: isPanning ? cursorGrabbingFinal : cursorGrabFinal }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div
          ref={contentRef}
          className="flex justify-center min-w-max pt-4 origin-top"
          style={{ transform: "translate(" + pan.x + "px, " + pan.y + "px) scale(" + zoom + ")" }}
        >
          {departments.length > 0 && (
            <TreeNode
              dept={departments[0]}
              isRoot={true}
              level={0}
              readOnly={isReadOnly}
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

      {/* RENDER MODALS */}
      <AddDepartmentModal open={addDeptModalOpen} onOpenChange={setAddDeptModalOpen} parentId={parentDeptForAdd?.id} parentName={parentDeptForAdd?.name} onSubmit={() => fetchData()} />
      <AddTeamModal open={addTeamModalOpen} onOpenChange={setAddTeamModalOpen} onSubmit={handleAddEntity} />
      <AddSubTeamModal open={addSubTeamModalOpen} onOpenChange={setAddSubTeamModalOpen} onSubmit={handleAddEntity} />
      
      {deptToDelete && (
        <DeleteDepartmentModal open={deleteModalOpen} onOpenChange={setDeleteModalOpen} departmentName={deptToDelete.name} onConfirm={() => executeDeleteDepartment(deptToDelete.id)} />
      )}

      {selectedDept && (
        <>
          <EditDepartmentModal open={editModalOpen} onOpenChange={setEditModalOpen} department={selectedDept} onSubmit={handleEditDepartment} />
          <EditTeamModal open={editTeamModalOpen} onOpenChange={setEditTeamModalOpen} department={selectedDept} onSubmit={handleEditDepartment} />
          <AddEmployeesModal open={addEmployeesModalOpen} onOpenChange={setAddEmployeesModalOpen} department={selectedDept} />
        </>
      )}

      {draggedEmployee && sourceDept && targetDept && (
        <MoveEmployeeModal open={moveModalOpen} onOpenChange={setMoveModalOpen} employeeName={draggedEmployee.name} sourceTeamName={sourceDept.name} targetTeamName={targetDept.name} onConfirm={confirmMoveEmployee} />
      )}
    </div>
  )
}