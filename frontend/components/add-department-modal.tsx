"use client"

import type React from "react"
import { useState, useEffect } from "react" // Import thêm useEffect nếu cần reset form
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddDepartmentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (dept: any) => void
}

export function AddDepartmentModal({ open, onOpenChange, onSubmit }: AddDepartmentModalProps) {
  // 1. State lưu dữ liệu form
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    managerId: "",
    manager: "",
  })

  // 2. State lưu lỗi (Mới thêm)
  const [errors, setErrors] = useState({
    name: "",
    code: "",
    managerId: "",
  })

  // Mock managers list
  const managers = [
    { id: "mgr-001", name: "David Lee" },
    { id: "mgr-002", name: "Emily Carter" },
    { id: "mgr-003", name: "Michael Brown" },
    { id: "mgr-004", name: "Sarah Johnson" },
  ]

  // Reset form và lỗi khi đóng/mở modal
  useEffect(() => {
    if (open) {
      setFormData({ name: "", code: "", description: "", managerId: "", manager: "" })
      setErrors({ name: "", code: "", managerId: "" })
    }
  }, [open])

  // 3. Hàm kiểm tra hợp lệ (Mới thêm)
  const validateForm = () => {
    let isValid = true
    const newErrors = { name: "", code: "", managerId: "" }

    if (!formData.name.trim()) {
      newErrors.name = "Department Name is required"
      isValid = false
    }

    if (!formData.code.trim()) {
      newErrors.code = "Department Code is required"
      isValid = false
    }

    if (!formData.managerId) {
      newErrors.managerId = "Manager is required"
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // 4. Gọi hàm validate trước khi submit
    if (validateForm()) {
      const selectedManager = managers.find((m) => m.id === formData.managerId)
      onSubmit({
        ...formData,
        manager: selectedManager?.name || "",
      })
      // Form sẽ được reset nhờ useEffect khi modal đóng, hoặc bạn có thể reset thủ công ở đây
    }
  }

  // Hàm helper để xóa lỗi khi người dùng bắt đầu nhập liệu lại
  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field as keyof typeof errors]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Department</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Input Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Department Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Marketing"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                // Thêm viền đỏ nếu có lỗi
                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {/* Hiển thị dòng lỗi */}
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>

            {/* Input Code */}
            <div className="space-y-2">
              <Label htmlFor="code">
                Department Code <span className="text-red-500">*</span>
              </Label>
              <Input
                id="code"
                placeholder="e.g. MKT0"
                value={formData.code}
                onChange={(e) => handleChange("code", e.target.value)}
                className={errors.code ? "border-red-500 focus-visible:ring-red-500" : ""}
              />
              {errors.code && <p className="text-red-500 text-xs">{errors.code}</p>}
            </div>
          </div>

          {/* Description (Không bắt buộc nên không cần check lỗi) */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter a short description for the department"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Manager Select */}
          <div className="space-y-2">
            <Label htmlFor="manager">
              Department Manager <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.managerId}
              onValueChange={(value) => handleChange("managerId", value)}
            >
              <SelectTrigger 
                id="manager" 
                className={errors.managerId ? "border-red-500 ring-offset-red-500" : ""}
              >
                <SelectValue placeholder="Search by name or employee ID" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.managerId && <p className="text-red-500 text-xs">{errors.managerId}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
            >
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}