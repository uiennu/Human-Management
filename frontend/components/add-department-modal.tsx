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
  onSubmit: () => void
  parentId?: string | null // Nếu có parentId => Đang tạo Team (Sub-department)
  parentName?: string
}

export function AddDepartmentModal({ open, onOpenChange, onSubmit, parentId, parentName }: AddDepartmentModalProps) {
  // Xác định xem đang tạo Team hay tạo Department
  const isTeam = !!parentId

  // 1. State lưu dữ liệu form
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    managerId: "",
  })

  const [loading, setLoading] = useState(false)
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([])
  const [errors, setErrors] = useState({ name: "" })

  // 2. Fetch danh sách nhân viên khi mở Modal
  useEffect(() => {
    if (open) {
      // Reset form
      setFormData({ name: "", code: "", description: "", managerId: "" })
      setErrors({ name: "" })

      const fetchEmployees = async () => {
        try {
          const employees = await organizationService.getAllEmployees()

          // Debug: In ra xem thực sự API trả về cái gì
          console.log("API Employees Response:", employees);

          let eligibleManagers = employees

          // Nếu đang tạo Team, chỉ lấy nhân viên thuộc phòng ban cha
          if (isTeam && parentName) {
            eligibleManagers = employees.filter(e => e.departmentName === parentName)
            if (eligibleManagers.length === 0) eligibleManagers = employees;
          }

          const uniqueMap = new Map();

          eligibleManagers.forEach((e: any) => {
            const id = e.employeeID || e.EmployeeID;

            // --- LOGIC LẤY TÊN MỚI (QUAN TRỌNG) ---
            // 1. Thử lấy Name (do Dapper trả về)
            // 2. Nếu không có, thử ghép FirstName + LastName (do EF Core trả về)
            let fullName = e.Name || e.name;

            if (!fullName) {
              const fName = e.firstName || e.FirstName || '';
              const lName = e.lastName || e.LastName || '';
              fullName = `${fName} ${lName}`.trim();
            }
            // ---------------------------------------

            if (id && !uniqueMap.has(id)) {
              uniqueMap.set(id, { id, name: fullName || `Employee #${id}` });
            }
          });

          setManagers(Array.from(uniqueMap.values()));

        } catch (error) {
          console.error("Failed to fetch employees", error)
          toast.error("Failed to load employees list")
        }
      }
      fetchEmployees()
    }
  }, [open, isTeam, parentName])

  // 3. Validate
  const validateForm = () => {
    if (!formData.name.trim()) {
      setErrors({ name: isTeam ? "Team Name is required" : "Department Name is required" })
      return false
    }
    return true
  }

  // 4. Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)

      // --- TRƯỜNG HỢP 1: TẠO TEAM (Tạm thời tắt để bạn của bạn làm) ---
      if (isTeam && parentId) {
        // const deptId = parseInt(parentId.replace("dept-", ""))
        // await organizationService.createTeam(...)

        toast.info("Add Team feature is currently handled by another member.")
        // return; // Uncomment dòng này nếu muốn chặn luôn không cho đóng modal
      }

      // --- TRƯỜNG HỢP 2: TẠO DEPARTMENT (Phòng ban cấp cao) ---
      else {
        // Validate Department Code (Backend bắt buộc)
        if (!formData.code.trim()) {
          toast.error("Department Code is required")
          setLoading(false)
          return
        }

        await organizationService.createDepartment({
          name: formData.name,
          departmentCode: formData.code,
          description: formData.description,
          managerId: formData.managerId ? parseInt(formData.managerId) : null
        })

        toast.success("Department created successfully")

        // Refresh data & Đóng modal
        onSubmit()
        onOpenChange(false)
      }

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Failed to create")
    } finally {
      setLoading(false)
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

            {/* Input Code (Chỉ hiện khi tạo Department) */}
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
                  className="uppercase"
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

            {/* Manager Select */}
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