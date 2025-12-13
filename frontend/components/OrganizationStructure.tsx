"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Edit2, Trash2, Users, Eye, X, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

// --- IMPORT CÁC MODAL ---
import { AddDepartmentModal } from "@/components/add-department-modal"
import { DeleteDepartmentModal } from "@/components/delete-department-modal"
import { AddTeamModal } from "@/components/add-team-modal"
import { AddSubTeamModal } from "@/components/add-subteam-modal"
import { EditDepartmentModal } from "@/components/edit-department-modal"
import { AddEmployeesModal } from "@/components/add-employees-modal"
import { MoveEmployeeModal } from "@/components/move-employee-modal"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Department {
  id: string
  name: string
  code: string
  manager: string
  managerId: string
  description: string
  employees: Employee[]
  subdepartments?: Department[]
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
  onAddClick: (dept: Department, level: number) => void
  onEditClick: (dept: Department) => void
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
  onAddClick: (dept: Department, level: number) => void
  onEditClick: (dept: Department) => void
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
  onAddClick,
  onEditClick,
  onDeleteClick,
  onAddEmployeeClick,
  onDeleteEmployee,
  onDragStart,
  onDrop
}: DepartmentCardProps) => {
  const [isEmployeesOpen, setIsEmployeesOpen] = useState(false)

  // Tooltip text
  const getTooltip = () => {
    if (level === 0) return "Add Department"
    if (level === 1) return "Add Team"
    return "Add Sub-team"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
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
            <div>
              <h3 className="font-bold text-gray-900 text-base">{dept.name}</h3>
              <p className="text-sm text-gray-500">{dept.description}: {dept.manager}</p>
            </div>

            {!isRoot && (
              <div className="flex gap-1">
                <button
                  onClick={() => onEditClick(dept)}
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

          {/* TOGGLE BUTTON (SHOW) */}
          {!isRoot && dept.employees.length > 0 && !isEmployeesOpen && (
            <div className="mt-2">
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

        {/* RENDER EMPLOYEES INSIDE DEPARTMENT CARD (Vertical List) */}
        {!isRoot && isEmployeesOpen && dept.employees.length > 0 && (
          <div className="px-4 pb-4 space-y-3">
            {dept.employees.map((emp) => (
              <div
                key={emp.id}
                draggable
                onDragStart={(e) => onDragStart(e, emp, dept)}
                className="relative flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ cursor: cursorGrabFinal }}
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
                <button onClick={() => onDeleteEmployee(dept.id, emp.id)} className="ml-auto p-1 text-gray-400 hover:text-red-500" style={{ cursor: cursorPointerFinal }}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}

            {/* CLOSE BUTTON AT BOTTOM OF LIST */}
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

        {!isRoot && (
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
          {/* Line connecting Parent (Card+Emp) to Teams */}
          <div className="w-px h-8 bg-gray-300"></div>

          {/* Teams List */}
          <div className="flex flex-col gap-6 pl-8 border-l border-gray-300 ml-8">
            {dept.subdepartments!.map((sub) => (
              <div key={sub.id} className="relative">
                {/* Horizontal line connecting to Child */}
                <div className="absolute top-10 -left-8 w-8 h-px bg-gray-300"></div>
                <TreeNode
                  dept={sub}
                  isRoot={false}
                  level={level + 1}
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
  // --- MOCK DATA (ĐÃ KHÔI PHỤC ĐẦY ĐỦ) ---
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: "root",
      name: "Global Tech Inc.",
      code: "ROOT",
      manager: "Amanda Chen",
      managerId: "ceo-001",
      description: "CEO",
      employees: [],
      subdepartments: [
        {
          id: "1",
          name: "Engineering",
          code: "ENG",
          manager: "Raj Patel",
          managerId: "mgr-001",
          description: "Manager",
          subdepartments: [
            {
              id: "1-1",
              name: "Frontend",
              code: "FE",
              manager: "Emily Carter",
              managerId: "mgr-002",
              description: "Lead",
              employees: [
                { id: "emp-001", name: "Olivia Chen", position: "Senior Engineer" },
                { id: "emp-004", name: "Liam Johnson", position: "Frontend Dev" },
                { id: "emp-005", name: "Sophia Williams", position: "Junior Dev" }
              ],
            },
            {
              id: "1-2",
              name: "Backend",
              code: "BE",
              manager: "Michael Brown",
              managerId: "mgr-003",
              description: "Lead",
              employees: [{ id: "emp-002", name: "Ben Carter", position: "Software Engineer" }],
            },
          ],
          employees: [], // No employees directly in Engineering
        },
        {
          id: "2",
          name: "Product",
          code: "PROD",
          manager: "David Lee",
          managerId: "mgr-004",
          description: "Manager",
          subdepartments: [
            {
              id: "2-1",
              name: "Design",
              code: "DES",
              manager: "Ava Garcia",
              managerId: "mgr-006",
              description: "Lead",
              employees: [{ id: "emp-003", name: "Ava Garcia", position: "Product Designer" }],
            }
          ],
          employees: [], // No employees directly in Product
        },
        {
          id: "3",
          name: "Human Resources",
          code: "HR",
          manager: "Sarah",
          managerId: "mgr-005",
          description: "Manager",
          employees: [],
        },
      ],
    },
  ])

  // --- STATE QUẢN LÝ 3 LOẠI MODAL ---
  const [addDeptModalOpen, setAddDeptModalOpen] = useState(false)
  const [addTeamModalOpen, setAddTeamModalOpen] = useState(false)
  const [addSubTeamModalOpen, setAddSubTeamModalOpen] = useState(false)

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [addEmployeesModalOpen, setAddEmployeesModalOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deptToDelete, setDeptToDelete] = useState<Department | null>(null)

  // Drag and Drop State
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [draggedEmployee, setDraggedEmployee] = useState<Employee | null>(null)
  const [sourceDept, setSourceDept] = useState<Department | null>(null)
  const [targetDept, setTargetDept] = useState<Department | null>(null)

  // Lưu cha hiện tại để biết đang add con vào đâu
  const [parentDeptForAdd, setParentDeptForAdd] = useState<Department | null>(null)

  // --- HANDLER CHUNG ---
  const handleAddEntity = (data: Omit<Department, "id" | "employees" | "subdepartments">) => {
    const newEntity: Department = {
      ...data,
      id: Date.now().toString(),
      employees: [],
      subdepartments: [],
    }

    if (parentDeptForAdd) {
      // Logic đệ quy tìm cha và thêm con vào subdepartments
      const addRecursive = (depts: Department[]): Department[] => {
        return depts.map((d) => {
          if (d.id === parentDeptForAdd.id) {
            return {
              ...d,
              subdepartments: [...(d.subdepartments || []), newEntity],
            }
          }
          if (d.subdepartments && d.subdepartments.length > 0) {
            return {
              ...d,
              subdepartments: addRecursive(d.subdepartments),
            }
          }
          return d
        })
      }
      setDepartments(addRecursive(departments))
    } else {
      setDepartments([...departments, newEntity])
    }

    // Đóng tất cả modal sau khi submit
    setAddDeptModalOpen(false)
    setAddTeamModalOpen(false)
    setAddSubTeamModalOpen(false)
    setParentDeptForAdd(null)
  }

  // --- CÁC HÀM EDIT/DELETE ---
  const handleEditDepartment = (updated: Omit<Department, "employees" | "subdepartments">) => {
    const updateRecursive = (depts: Department[]): Department[] =>
      depts.map((dept) =>
        dept.id === updated.id
          ? { ...dept, ...updated }
          : { ...dept, subdepartments: dept.subdepartments ? updateRecursive(dept.subdepartments) : [] },
      )
    setDepartments(updateRecursive(departments))
    setEditModalOpen(false)
    setSelectedDept(null)
  }

  // HÀM NÀY SẼ ĐƯỢC ĐỔI TÊN THÀNH showDeleteConfirmation VÀ CHỈ DÙNG ĐỂ MỞ MODAL
  const showDeleteConfirmation = (dept: Department) => {
    setDeptToDelete(dept) // Lưu thông tin phòng ban cần xóa
    setDeleteModalOpen(true) // Mở modal
  }

  // HÀM MỚI NÀY SẼ CHỊU TRÁCH NHIỆM XÓA THỰC TẾ SAU KHI XÁC NHẬN
  const executeDeleteDepartment = (id: string) => {
    const deleteRecursive = (depts: Department[]): Department[] =>
      depts
        .filter((dept) => dept.id !== id)
        .map((dept) => ({
          ...dept,
          subdepartments: dept.subdepartments ? deleteRecursive(dept.subdepartments) : [],
        }))
    setDepartments(deleteRecursive(departments))
    // Cần đóng modal và reset state sau khi xóa xong
    setDeleteModalOpen(false)
    setDeptToDelete(null)
  }

  const handleDeleteEmployee = (deptId: string, empId: string) => {
    const updateRecursive = (depts: Department[]): Department[] =>
      depts.map((dept) => {
        if (dept.id === deptId) {
          return {
            ...dept,
            employees: dept.employees.filter((e) => e.id !== empId),
          }
        }
        return {
          ...dept,
          subdepartments: dept.subdepartments ? updateRecursive(dept.subdepartments) : [],
        }
      })
    setDepartments(updateRecursive(departments))
  }

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent, employee: Employee, source: Department) => {
    setDraggedEmployee(employee)
    setSourceDept(source)
    // Set data transfer for compatibility
    e.dataTransfer.setData("text/plain", employee.id)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDrop = (e: React.DragEvent, target: Department, targetLevel: number) => {
    e.preventDefault()
    if (!draggedEmployee || !sourceDept) return

    // Prevent dropping on the same department
    if (sourceDept.id === target.id) return

    // RESTRICTION: Employees can only be in Teams (Level >= 2)
    // Level 0 = Root, Level 1 = Department, Level 2 = Team/Sub-team
    if (targetLevel < 2) {
      // Optional: Show a toast or visual feedback that drop is invalid
      console.warn("Cannot drop employee into a Department. Must be a Team.")
      return
    }

    setTargetDept(target)
    setMoveModalOpen(true)
  }

  const confirmMoveEmployee = () => {
    if (!draggedEmployee || !sourceDept || !targetDept) return

    const updateRecursive = (depts: Department[]): Department[] => {
      return depts.map((dept) => {
        let newDept = { ...dept }

        // Remove from source
        if (dept.id === sourceDept.id) {
          newDept.employees = dept.employees.filter(e => e.id !== draggedEmployee.id)
        }

        // Add to target
        if (dept.id === targetDept.id) {
          newDept.employees = [...dept.employees, draggedEmployee]
        }

        // Recurse
        if (dept.subdepartments && dept.subdepartments.length > 0) {
          newDept.subdepartments = updateRecursive(dept.subdepartments)
        }

        return newDept
      })
    }

    setDepartments(updateRecursive(departments))
    setMoveModalOpen(false)
    setDraggedEmployee(null)
    setSourceDept(null)
    setTargetDept(null)
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
  const handleResetZoom = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Helper to constrain pan
  const clampPan = (newPan: { x: number; y: number }, currentZoom: number) => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return newPan

    const containerRect = container.getBoundingClientRect()
    // We use offsetWidth/Height for the un-scaled dimensions
    const contentW = content.offsetWidth
    const contentH = content.offsetHeight

    // Logic for transform-origin: top (center top)
    // VisualLeft = pan.x + width*(1-zoom)/2
    // VisualRight = pan.x + width*(1+zoom)/2
    // VisualTop = pan.y
    // VisualBottom = pan.y + height*zoom

    // Constraints:
    // 1. VisualRight > 50  => pan.x > 50 - width*(1+zoom)/2
    // 2. VisualLeft < containerWidth - 50 => pan.x < containerWidth - 50 - width*(1-zoom)/2
    // 3. VisualBottom > 50 => pan.y > 50 - height*zoom
    // 4. VisualTop < containerHeight - 50 => pan.y < containerHeight - 50

    const minX = 50 - (contentW * (1 + currentZoom)) / 2
    const maxX = containerRect.width - 50 - (contentW * (1 - currentZoom)) / 2

    const minY = 50 - (contentH * currentZoom)
    const maxY = containerRect.height - 50

    return {
      x: Math.min(Math.max(newPan.x, minX), maxX),
      y: Math.min(Math.max(newPan.y, minY), maxY)
    }
  }

  // --- PAN & ZOOM HANDLERS ---
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (e.ctrlKey) {
        // Zoom
        const delta = e.deltaY * -0.001
        setZoom((prev) => Math.min(Math.max(prev + delta, 0.5), 2))
      } else {
        // Pan
        setPan((prev) => {
          const newPan = { x: prev.x - e.deltaX, y: prev.y - e.deltaY }
          return clampPan(newPan, zoom)
        })
      }
    }

    container.addEventListener("wheel", onWheel, { passive: false })

    return () => {
      container.removeEventListener("wheel", onWheel)
    }
  }, [zoom])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow panning with left click (if not on a button/node) or middle click
    // We might want to restrict this if it conflicts with DnD.
    // For now, let's assume background drag.
    if (e.button === 0 || e.button === 1) {
      setIsPanning(true)
      setLastMousePos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const deltaX = e.clientX - lastMousePos.x
      const deltaY = e.clientY - lastMousePos.y
      setPan((prev) => {
        const newPan = { x: prev.x + deltaX, y: prev.y + deltaY }
        return clampPan(newPan, zoom)
      })
      setLastMousePos({ x: e.clientX, y: e.clientY })
    }
  }

  const handleMouseUp = () => {
    setIsPanning(false)
  }

  // --- ACTION HANDLERS FOR CHILD COMPONENTS ---
  const handleAddClick = (dept: Department, level: number) => {
    setParentDeptForAdd(dept)
    if (level === 0) {
      setAddDeptModalOpen(true)
    } else if (level === 1) {
      setAddTeamModalOpen(true)
    } else {
      setAddSubTeamModalOpen(true)
    }
  }

  const handleEditClick = (dept: Department) => {
    setSelectedDept(dept)
    setEditModalOpen(true)
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
            <button onClick={handleZoomOut} className="p-2 hover:bg-gray-100 text-gray-600 rounded-l-md" title="Zoom Out" style={{ cursor: cursorPointerFinal }}>
              <ChevronDown className="h-4 w-4" />
            </button>
            <span className="px-2 text-sm font-medium text-gray-600 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2 hover:bg-gray-100 text-gray-600 rounded-r-md" title="Zoom In" style={{ cursor: cursorPointerFinal }}>
              <ChevronUp className="h-4 w-4" />
            </button>
            <button onClick={handleResetZoom} className="p-2 hover:bg-gray-100 text-gray-600 border-l border-gray-200" title="Reset Zoom" style={{ cursor: cursorPointerFinal }}>
              <Eye className="h-4 w-4" />
            </button>
          </div>

          <Button
            onClick={() => { setParentDeptForAdd(null); setAddDeptModalOpen(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            style={{ cursor: cursorPointerFinal }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
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

      {/* RENDER CÁC MODAL */}
      <AddDepartmentModal
        open={addDeptModalOpen}
        onOpenChange={setAddDeptModalOpen}
        onSubmit={handleAddEntity}
      />

      <AddTeamModal
        open={addTeamModalOpen}
        onOpenChange={setAddTeamModalOpen}
        onSubmit={handleAddEntity}
      />

      <AddSubTeamModal
        open={addSubTeamModalOpen}
        onOpenChange={setAddSubTeamModalOpen}
        onSubmit={handleAddEntity}
      />

      {
        deptToDelete && (
          <DeleteDepartmentModal
            open={deleteModalOpen}
            onOpenChange={setDeleteModalOpen}
            departmentName={deptToDelete.name}
            onConfirm={() => executeDeleteDepartment(deptToDelete.id)}
          />
        )
      }

      {
        selectedDept && (
          <>
            <EditDepartmentModal open={editModalOpen} onOpenChange={setEditModalOpen} department={selectedDept} onSubmit={handleEditDepartment} />
            <AddEmployeesModal open={addEmployeesModalOpen} onOpenChange={setAddEmployeesModalOpen} department={selectedDept} />
          </>
        )
      }

      {
        draggedEmployee && sourceDept && targetDept && (
          <MoveEmployeeModal
            open={moveModalOpen}
            onOpenChange={setMoveModalOpen}
            employeeName={draggedEmployee.name}
            sourceTeamName={sourceDept.name}
            targetTeamName={targetDept.name}
            onConfirm={confirmMoveEmployee}
          />
        )
      }
    </div >
  )
}
