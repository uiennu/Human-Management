"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { organizationService } from "@/lib/api/organization-service"

interface Department {
  id: string; 
  name: string; 
  code: string; 
  manager: string; 
  managerId: string; 
  description: string
}

interface Employee {
  employeeID: number; 
  name: string; 
  position?: string 
}

interface EditDepartmentModalProps {
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  department: Department; 
  onSubmit: (dept: Department) => void
}

export function EditDepartmentModal({ open, onOpenChange, department, onSubmit }: EditDepartmentModalProps) {
  const [formData, setFormData] = useState(department)
  const [employees, setEmployees] = useState<Employee[]>([])
  
  // State lưu lỗi validation
  const [errors, setErrors] = useState({ name: "", code: "" })

  useEffect(() => { 
      setFormData(department);
      setErrors({ name: "", code: "" }); // Reset lỗi khi mở modal
  }, [department, open])

  useEffect(() => {
    const fetchEmployees = async () => {
      if (open) {
        try {
          const data = await organizationService.getAllEmployees();
          setEmployees(data);
        } catch (e) { console.error(e) }
      }
    };
    fetchEmployees();
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newErrors = { name: "", code: "" }
    let hasError = false

    // 1. Validate Name
    if (!formData.name || formData.name.trim() === "") {
        newErrors.name = "Department Name is required!";
        hasError = true;
    }

    // 2. Validate Code (Thay alert bằng state)
    if (!formData.code || formData.code.trim() === "") {
        newErrors.code = "Department Code is required!";
        hasError = true;
    }

    setErrors(newErrors);

    if (hasError) return;

    // Nếu hợp lệ thì submit
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update department details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <Label>Name <span className="text-red-500">*</span></Label>
               <Input 
                 value={formData.name} 
                 // Nếu có lỗi thì viền đỏ
                 className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                 onChange={e => {
                     setFormData({...formData, name: e.target.value});
                     // Khi người dùng gõ lại, xóa lỗi đi
                     if(e.target.value.trim() !== "") setErrors({...errors, name: ""});
                 }} 
               />
               {/* Hiển thị dòng thông báo lỗi */}
               {errors.name && <p className="text-xs text-red-500 font-medium">{errors.name}</p>}
             </div>

             <div className="space-y-2">
               <Label>Code <span className="text-red-500">*</span></Label>
               <Input 
                 value={formData.code} 
                 
                 // 1. Thêm logic đổi màu viền đỏ nếu có lỗi errors.code
                 className={errors.code ? "border-red-500 focus-visible:ring-red-500" : ""}
                 
                 onChange={(e) => {
                    setFormData({ ...formData, code: e.target.value });
                    
                    // 2. Thêm logic: Nếu người dùng nhập gì đó, xóa lỗi 'code' đi ngay
                    if (e.target.value.trim() !== "") {
                        setErrors({ ...errors, code: "" });
                    }
                 }}
                 placeholder="e.g. HR-REC" 
               />
               
               {/* 3. Hiển thị dòng thông báo lỗi đỏ bên dưới */}
               {errors.code && <p className="text-xs text-red-500 font-medium">{errors.code}</p>}
             </div>
          </div>
          
          <div className="space-y-2">
             <Label>Description</Label>
             <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div className="space-y-2">
            <Label>Manager</Label>
            <Select
              // Nếu managerId rỗng thì hiện unassigned (None)
              value={formData.managerId ? formData.managerId.toString() : "unassigned"}
              onValueChange={(value) => {
                const realId = value === "unassigned" ? "" : value;
                const emp = employees.find(e => e.employeeID.toString() === realId);
                setFormData({ ...formData, managerId: realId, manager: emp ? emp.name : "" })
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">-- None --</SelectItem>
                {employees.map(e => (
                  <SelectItem key={e.employeeID} value={e.employeeID.toString()}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}