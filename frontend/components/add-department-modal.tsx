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

      const fetchEmployees = async () => {
        try {
          const employees = await organizationService.getAllEmployees();

          let eligibleManagers = employees;

          // Nếu đang thêm Team vào Department, lọc nhân viên thuộc Department đó
          if (isTeam && parentId && parentName) {
            eligibleManagers = employees.filter(e => e.departmentName === parentName);
          }

          // Nếu đang thêm Department, lọc nhân viên chưa thuộc bất kỳ Department nào
          if (!isTeam) {
            eligibleManagers = employees.filter(e => !e.departmentName);
          }

          // Lọc trùng lặp ID trước khi map
          const uniqueManagers = Array.from(
            new Map(eligibleManagers.map(item => [item.employeeID, item])).values()
          );

          setManagers(uniqueManagers.map(e => ({
            id: e.employeeID,
            name: e.name
          })));
        } catch (error) {
          console.error("Failed to fetch employees", error);
          setManagers([]);
        }
      }

      fetchEmployees();
    }
  }, [open, isTeam, parentId, parentName]);

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

    // 1. Validate các trường chung (như Name)
    if (validateForm()) {
      try {
        setLoading(true)

        // TRƯỜNG HỢP 1: TẠO TEAM (SUB-DEPARTMENT)
        if (isTeam && parentId) {
          const deptId = parseInt(parentId.replace("dept-", ""))

          if (isNaN(deptId)) {
            toast.error("Invalid Department ID for creating a team.")
            return // Thoát hàm, finally sẽ chạy để tắt loading
          }

          await organizationService.createTeam(deptId, {
            teamName: formData.name,
            description: formData.description,
            teamLeadId: formData.managerId ? parseInt(formData.managerId) : undefined
          })

          toast.success("Team created successfully")
        }
        // TRƯỜNG HỢP 2: TẠO DEPARTMENT (PHÒNG BAN CẤP CAO)
        else {
          // Validate riêng cho Department: Bắt buộc phải có Code
          if (!formData.code.trim()) {
            toast.error("Department Code is required")
            return // Thoát hàm, finally sẽ chạy để tắt loading
          }

          await organizationService.createDepartment({
            name: formData.name,
            departmentCode: formData.code,
            description: formData.description,
            managerId: formData.managerId ? parseInt(formData.managerId) : null
          })

          toast.success("Department created successfully")
        }

        // 3. Nếu thành công (không bị lỗi ở trên) thì làm mới dữ liệu và đóng modal
        onSubmit()
        onOpenChange(false)

      } catch (error: any) {
        // 4. Bắt lỗi từ API trả về
        toast.error(error.message || "Failed to create")
      } finally {
        // 5. Luôn tắt loading dù thành công hay thất bại
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

            {!isTeam && (
              <div className="space-y-2">
                <Label htmlFor="code">
                  Department Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  placeholder="e.g. HR, IT, SALE"
                  value={formData.code}
                  onChange={(e) => handleChange("code", e.target.value)}
                  className="uppercase" // Code thường viết hoa
                  disabled={loading}
                />
              </div>
            )}

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