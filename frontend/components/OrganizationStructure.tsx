"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Users, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// --- IMPORT CÁC MODAL ---
import { AddDepartmentModal } from "@/components/add-department-modal"
import { AddTeamModal } from "@/components/add-team-modal"
import { AddSubTeamModal } from "@/components/add-subteam-modal"
import { EditDepartmentModal } from "@/components/edit-department-modal"
import { AddEmployeesModal } from "@/components/add-employees-modal"
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
              employees: [{ id: "emp-001", name: "Olivia Chen", position: "Software Engineer" }],
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
          employees: [],
        },
        {
          id: "2",
          name: "Product",
          code: "PROD",
          manager: "David Lee",
          managerId: "mgr-004",
          description: "Manager",
          employees: [{ id: "emp-003", name: "Ava Garcia", position: "Product Designer" }],
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

  const handleDeleteDepartment = (id: string) => {
    const deleteRecursive = (depts: Department[]): Department[] =>
      depts
        .filter((dept) => dept.id !== id)
        .map((dept) => ({
          ...dept,
          subdepartments: dept.subdepartments ? deleteRecursive(dept.subdepartments) : [],
        }))
    setDepartments(deleteRecursive(departments))
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

  // --- DEPARTMENT CARD ---
  const DepartmentCard = ({ dept, isRoot, level = 0 }: { dept: Department; isRoot?: boolean, level?: number }) => {
    
    // Logic: Khi bấm dấu + thì mở modal nào?
    const handleAddClick = () => {
      setParentDeptForAdd(dept) // Set cha là card hiện tại
      
      if (level === 0) {
        setAddDeptModalOpen(true)
      } else if (level === 1) {
        setAddTeamModalOpen(true)
      } else {
        setAddSubTeamModalOpen(true)
      }
    }

    // Tooltip text
    const getTooltip = () => {
      if (level === 0) return "Add Department"
      if (level === 1) return "Add Team"
      return "Add Sub-team"
    }

    return (
      <div className="flex flex-col items-center z-10 relative">
        <div className="w-72 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-gray-900 text-base">{dept.name}</h3>
                <p className="text-sm text-gray-500">{dept.description}: {dept.manager}</p>
              </div>
              
              {!isRoot && (
                <div className="flex gap-1">
                  {/* NÚT ADD (+) */}
                  <button
                    onClick={handleAddClick}
                    title={getTooltip()}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>

                  <button
                    onClick={() => { setSelectedDept(dept); setEditModalOpen(true); }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDepartment(dept.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 mt-4">
              {dept.employees.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between group py-1">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 bg-gray-100">
                      <AvatarFallback className="text-xs text-gray-600 font-medium">
                        {emp.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-700">{emp.name}</p>
                      <p className="text-[10px] text-gray-400">{emp.position}</p>
                    </div>
                  </div>
                  <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDeleteEmployee(dept.id, emp.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!isRoot && (
            <div className="border-t border-gray-100 p-2 bg-gray-50/50">
              <button
                onClick={() => { setSelectedDept(dept); setAddEmployeesModalOpen(true); }}
                className="w-full flex items-center justify-center gap-2 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Employee
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // --- TREE NODE ---
  const TreeNode = ({ dept, isRoot = false, level = 0 }: { dept: Department; isRoot?: boolean, level?: number }) => {
    const hasChildren = dept.subdepartments && dept.subdepartments.length > 0;
    return (
      <div className="flex flex-col items-center">
        <DepartmentCard dept={dept} isRoot={isRoot} level={level} />

        {hasChildren && (
          <>
            <div className="h-8 w-px bg-gray-300" />
            <div className="flex pt-0">
              {dept.subdepartments!.map((sub, index, arr) => (
                <div key={sub.id} className="relative px-6 pt-6"> 
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-6 bg-gray-300" />
                  {index > 0 && <div className="absolute top-0 left-0 w-1/2 h-px bg-gray-300" />}
                  {index < arr.length - 1 && <div className="absolute top-0 right-0 w-1/2 h-px bg-gray-300" />}
                  <TreeNode dept={sub} isRoot={false} level={level + 1} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-gray-50/50 min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Organization Structure</h1>
          <p className="text-muted-foreground mt-1">Visualize and manage your company's hierarchy.</p>
        </div>
        <Button 
          onClick={() => { setParentDeptForAdd(null); setAddDeptModalOpen(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 overflow-x-auto min-h-[600px]">
        <div className="flex justify-center min-w-max pt-4">
          {departments.length > 0 && <TreeNode dept={departments[0]} isRoot={true} level={0} />}
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

      {selectedDept && (
        <>
          <EditDepartmentModal open={editModalOpen} onOpenChange={setEditModalOpen} department={selectedDept} onSubmit={handleEditDepartment} />
          <AddEmployeesModal open={addEmployeesModalOpen} onOpenChange={setAddEmployeesModalOpen} department={selectedDept} />
        </>
      )}
    </div>
  )
}