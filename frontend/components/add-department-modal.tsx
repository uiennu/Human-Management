"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { organizationService } from "@/lib/api/organization-service"
import { toast } from "sonner"

interface AddDepartmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void // Changed to void as we handle API internally
  parentId?: string | null // If present, we are adding a Team under this Department
  parentName?: string
}

export function AddDepartmentModal({ open, onOpenChange, onSubmit, parentId, parentName }: AddDepartmentModalProps) {
  const isTeam = !!parentId

  // 1. State lưu dữ liệu form
  const [formData, setFormData] = useState({
    name: "",
    code: "", // Teams might not strictly need code in UI but DB might not enforce it? DTO has Name, Desc, TeamLead.
    description: "",
    managerId: "", // This will be Team Lead ID
  })

  const [loading, setLoading] = useState(false)
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([])

  // 2. State lưu lỗi
  const [errors, setErrors] = useState({
    name: "",
  })

  // Fetch potential managers/team leads
  useEffect(() => {
    if (open) {
      // Reset form
      setFormData({ name: "", code: "", description: "", managerId: "" })
      setErrors({ name: "" })

      // Load employees for Team Lead selection
      const fetchEmployees = async () => {
        try {
          const employees = await organizationService.getAllEmployees()

          let eligibleManagers = employees

          // If adding a team to a department, filter employees belonging to that department
          if (isTeam && parentId) {
            const deptIdStr = parentId.replace("dept-", "")
            // API employees logic: employees have 'departmentName'. 
            // Ideally we should have departmentID in EmployeeDto but let's check.
            // Looking at OrganizationService.ts, EmployeeDto has:
            // employeeID, firstName, lastName, email, departmentName, position.
            // It does NOT have departmentID explicitly in common list?
            // Let's check organization-service.ts again.
            // EmployeeDto has: departmentName. 
            // But TeamMemberDto has departmentID.

            // If we really want to filter by ID, we need departmentID in EmployeeDto.
            // However, for now, we can rely on the backend validation or try to filter by name?
            // Or better: update EmployeeDto to include DepartmentID.
            // But I cannot easily update backend DTO and all mappings right now without risk.

            // Let's filter by matching departmentName if possible? 
            // "parentName" prop has the Department Name!
            if (parentName) {
              eligibleManagers = employees.filter(e => e.departmentName === parentName)
            }
          }

          setManagers(eligibleManagers.map(e => ({ id: e.employeeID, name: `${e.firstName} ${e.lastName}` })))
        } catch (error) {
          console.error("Failed to fetch employees", error)
        }
      }
      fetchEmployees()
    }
  }, [open, isTeam, parentId, parentName])

  // 3. Hàm kiểm tra hợp lệ
  const validateForm = () => {
    let isValid = true
    const newErrors = { name: "" }

    if (!formData.name.trim()) {
      newErrors.name = isTeam ? "Team Name is required" : "Department Name is required"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validateForm()) {
      try {
        setLoading(true)
        if (isTeam && parentId) {
          // Create SubTeam
          // parentId comes as "dept-123", we need "123"
          // Or if it's already numeric string, just parse.
          // In OrganizationStructure, we mapped id as "dept-{id}".
          const deptId = parseInt(parentId.replace("dept-", ""))

          if (isNaN(deptId)) {
            // Maybe it's a team? "team-456". 
            // Currently backend only supports adding team to DEPARTMENT.
            // If user clicked "Add Team" on a Team, that's "Add SubTeam" (Level 2).
            // Let's assume for now we only support Level 1 (Dept) -> Level 2 (Team).
            toast.error("Invalid Department ID for creating a team.")
            return
          }

          await organizationService.createTeam(deptId, {
            teamName: formData.name,
            description: formData.description,
            teamLeadId: formData.managerId ? parseInt(formData.managerId) : null
          })
          toast.success("Team created successfully")
        } else {
          toast.info("Creating top-level departments is not yet supported via API.")
          return
        }

        onSubmit() // Refreshes parent data
        onOpenChange(false)
      } catch (error: any) {
        toast.error(error.message || "Failed to create")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (field === 'name') setErrors({ ...errors, name: "" })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isTeam ? `Add Team to ${parentName}` : "Add Department"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Input Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                {isTeam ? "Team Name" : "Department Name"} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder={isTeam ? "e.g. Backend Team" : "e.g. Marketing"}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                disabled={loading}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter a short description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="resize-none"
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Manager/Team Lead Select */}
            <div className="space-y-2">
              <Label htmlFor="manager">
                {isTeam ? "Team Lead" : "Department Manager"}
              </Label>
              <Select
                value={formData.managerId}
                onValueChange={(value) => handleChange("managerId", value)}
                disabled={loading}
              >
                <SelectTrigger id="manager">
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {managers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id.toString()}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}