"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
  parentId?: string | null
  parentName?: string
}

export function AddDepartmentModal({ open, onOpenChange, onSubmit, parentId, parentName }: AddDepartmentModalProps) {
  const isTeam = !!parentId
  const [formData, setFormData] = useState({ name: "", code: "", description: "", managerId: "" })
  const [loading, setLoading] = useState(false)
  const [managers, setManagers] = useState<{ id: number; name: string }[]>([])

  useEffect(() => {
    if (open) {
      // Reset form
      setFormData({ name: "", code: "", description: "", managerId: "" })
      
      const fetchEmployees = async () => {
        try {
          const employees = await organizationService.getAllEmployees();
          let eligibleManagers = employees;

          // LOGIC LỌC:
          if (isTeam && parentId) {
             // Thêm Team: Chỉ lấy nhân viên đang ở trong Department cha
             eligibleManagers = employees.filter((e: any) => e.departmentName === parentName);
          } else {
             // Thêm Department: Chỉ lấy nhân viên CHƯA thuộc Department nào (tự do)
             eligibleManagers = employees.filter((e: any) => !e.departmentName);
          }

          // Map data để hiển thị
          const uniqueManagers = Array.from(new Map(eligibleManagers.map((item:any) => [item.employeeID, item])).values());
          setManagers(uniqueManagers.map((e: any) => ({ id: e.employeeID, name: e.name })));
        } catch (error) { 
          console.error(error);
          setManagers([]); 
        }
      }
      fetchEmployees();
    }
  }, [open, isTeam, parentId, parentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
        setLoading(true)
        if (isTeam && parentId) {
            const deptId = parseInt(parentId.replace("dept-", ""))
            await organizationService.createTeam(deptId, {
                teamName: formData.name,
                description: formData.description,
                teamLeadId: formData.managerId ? parseInt(formData.managerId) : undefined
            })
            toast.success("Team created successfully")
        } else {
            if (!formData.code) {
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
        }
        onSubmit()
        onOpenChange(false)
    } catch (error: any) {
        toast.error(error.message || "Failed to create")
    } finally {
        setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isTeam ? `Add Team to ${parentName}` : "Add New Department"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* NAME */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="col-span-3"
                placeholder={isTeam ? "e.g. Backend Team" : "e.g. Marketing"}
                required
              />
            </div>

            {/* CODE (Chỉ hiện khi thêm Department) */}
            {!isTeam && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="col-span-3 uppercase"
                  placeholder="e.g. MKT"
                />
              </div>
            )}

            {/* DESCRIPTION */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="col-span-3"
                placeholder="Short description..."
              />
            </div>

            {/* MANAGER / TEAM LEAD */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="manager" className="text-right">
                {isTeam ? "Team Lead" : "Manager"}
              </Label>
              <div className="col-span-3">
                <Select 
                  value={formData.managerId} 
                  onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                >
                  <SelectTrigger id="manager">
                    <SelectValue placeholder="Select an employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.length > 0 ? (
                        managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id.toString()}>
                            {manager.name}
                        </SelectItem>
                        ))
                    ) : (
                        <div className="p-2 text-sm text-gray-500 text-center">
                            {isTeam 
                                ? "No employees in this department" 
                                : "All employees are assigned. Add new employee first."}
                        </div>
                    )}
                  </SelectContent>
                </Select>
                {/* Gợi ý nhỏ bên dưới */}
                {managers.length === 0 && !isTeam && (
                    <p className="text-[10px] text-red-500 mt-1">
                        * Create a user without department first to assign as Manager.
                    </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}