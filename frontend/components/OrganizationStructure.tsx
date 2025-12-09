"use client"

import { useState } from "react"
import { Plus, Edit2, Trash2, Users, Eye, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddDepartmentModal } from "@/components/add-department-modal"
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
          description: "Product engineering team",
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

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [addEmployeesModalOpen, setAddEmployeesModalOpen] = useState(false)
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)

  const handleAddDepartment = (dept: Omit<Department, "id" | "employees" | "subdepartments">) => {
    const newDept: Department = {
      ...dept,
      id: Date.now().toString(),
      employees: [],
      subdepartments: [],
    }
    setDepartments([...departments, newDept])
    setAddModalOpen(false)
  }

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

  const DepartmentCard = ({ dept, isRoot }: { dept: Department; isRoot?: boolean }) => (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`rounded-lg border ${
          isRoot ? "bg-background border-border px-6 py-3" : "bg-card border-border px-4 py-3"
        } min-w-fit`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className={`font-semibold ${isRoot ? "text-base" : "text-sm"}`}>{dept.name}</h3>
            <p className="text-xs text-muted-foreground">
              {isRoot ? dept.description : `${dept.description}: ${dept.manager}`}
            </p>
          </div>

          {!isRoot && (
            <div className="flex gap-1 ml-2 flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedDept(dept)
                  setAddEmployeesModalOpen(true)
                }}
                className="p-1 hover:bg-muted rounded transition-colors"
                title="Add employees"
              >
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={() => {
                  setSelectedDept(dept)
                  setEditModalOpen(true)
                }}
                className="p-1 hover:bg-muted rounded transition-colors"
                title="Edit department"
              >
                <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={() => handleDeleteDepartment(dept.id)}
                className="p-1 hover:bg-destructive/10 rounded transition-colors"
                title="Delete department"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>
          )}
        </div>

        {dept.employees.length > 0 && (
          <div className="mt-2 pt-2 border-t border-muted space-y-1.5">
            {dept.employees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-1.5 text-xs justify-between group">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar className="h-5 w-5 flex-shrink-0">
                    <AvatarFallback className="text-[10px]">
                      {emp.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-muted-foreground truncate">{emp.name}</span>
                </div>
                <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => console.log("View employee:", emp)}
                    className="p-0.5 hover:bg-muted rounded transition-colors"
                    title="View employee details"
                  >
                    <Eye className="h-3 w-3 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDeleteEmployee(dept.id, emp.id)}
                    className="p-0.5 hover:bg-destructive/10 rounded transition-colors"
                    title="Remove employee"
                  >
                    <X className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isRoot && dept.employees.length === 0 && (
          <button
            onClick={() => {
              setSelectedDept(dept)
              setAddEmployeesModalOpen(true)
            }}
            className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            + Add Employee
          </button>
        )}
      </div>
    </div>
  )

  const TreeLevel = ({ departments: depts, level = 0 }: { departments: Department[]; level?: number }) => {
    if (level === 0) {
      const rootDept = depts[0]
      if (!rootDept) return null

      return (
        <div className="flex flex-col items-center gap-6">
          {/* Root node */}
          <DepartmentCard dept={rootDept} isRoot />

          {/* Connector line from root */}
          {rootDept.subdepartments && rootDept.subdepartments.length > 0 && (
            <>
              <div className="w-px h-6 bg-border" />

              {/* First level departments */}
              <div className="relative">
                <div className="flex gap-8 justify-center">
                  {rootDept.subdepartments?.map((dept, idx) => (
                    <div key={dept.id} className="flex flex-col items-center">
                      {/* Horizontal connector line */}
                      <div
                        className="absolute top-0 h-px bg-border"
                        style={{
                          left: `${(idx + 0.5) * 220 - 110}px`,
                          right: `${(rootDept.subdepartments && rootDept.subdepartments.length > 1) ? 0 : "auto"}`,
                          width: (rootDept.subdepartments && rootDept.subdepartments.length > 1) ? undefined : "0",
                        }}
                      />

                      {/* Vertical connector to department */}
                      <div className="w-px h-4 bg-border" />

                      {/* Department card */}
                      <div className="flex flex-col items-center gap-4">
                        <DepartmentCard dept={dept} />

                        {/* Sub-departments */}
                        {dept.subdepartments && dept.subdepartments.length > 0 && (
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-px h-4 bg-border" />

                            <div className="flex gap-8">
                              {dept.subdepartments.map((subdept) => (
                                <div key={subdept.id} className="flex flex-col items-center gap-2">
                                  <div className="w-px h-4 bg-border" />
                                  <DepartmentCard dept={subdept} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Horizontal line connecting all first-level departments */}
                {rootDept.subdepartments && rootDept.subdepartments.length > 1 && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-border" style={{ width: "100%" }} />
                )}
              </div>
            </>
          )}
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Structure</h1>
          <p className="text-muted-foreground mt-1">
            Visualize and manage your company's hierarchy. Drag and drop departments to adjust reporting lines.
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <div className="bg-muted/30 rounded-lg p-8 overflow-x-auto min-h-96">
        <div className="flex justify-center">
          <TreeLevel departments={departments} level={0} />
        </div>
      </div>

      <AddDepartmentModal open={addModalOpen} onOpenChange={setAddModalOpen} onSubmit={handleAddDepartment} />

      {selectedDept && (
        <>
          <EditDepartmentModal
            open={editModalOpen}
            onOpenChange={setEditModalOpen}
            department={selectedDept}
            onSubmit={handleEditDepartment}
          />
          <AddEmployeesModal
            open={addEmployeesModalOpen}
            onOpenChange={setAddEmployeesModalOpen}
            department={selectedDept}
          />
        </>
      )}
    </div>
  )
}
