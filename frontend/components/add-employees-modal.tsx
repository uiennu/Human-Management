"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { organizationService } from "@/lib/api/organization-service"

interface Department {
  id: string
  name: string
  parentDepartmentName?: string
}

interface Employee {
  id: string
  name: string
  position: string
  selected?: boolean
}

interface AddEmployeesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: Department
}

export function AddEmployeesModal({ open, onOpenChange, department }: AddEmployeesModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedManager, setSelectedManager] = useState("")
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)

  // Fetch employees when modal opens
  useEffect(() => {
    if (open && department.parentDepartmentName) {
      const fetchEmployees = async () => {
        try {
          setLoading(true)
          const allEmployees = await organizationService.getAllEmployees()

          // Filter: only employees in the parent department
          const filtered = allEmployees.filter(e =>
            e.departmentName === department.parentDepartmentName
          )

          setEmployees(filtered.map(e => ({
            id: e.employeeID.toString(),
            name: e.name,
            position: e.position || 'Staff',
            selected: false
          })))
        } catch (error) {
          console.error("Failed to fetch employees", error)
          setEmployees([])
        } finally {
          setLoading(false)
        }
      }
      fetchEmployees()
    }
  }, [open, department.parentDepartmentName])

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleToggleEmployee = (id: string) => {
    setEmployees(employees.map((emp) => (emp.id === id ? { ...emp, selected: !emp.selected } : emp)))
  }

  const selectedCount = employees.filter((e) => e.selected).length

  const handleSubmit = () => {
    // In real app, save to database
    console.log(`Added ${selectedCount} employees to ${department.name}`)
    setEmployees(employees.map((e) => ({ ...e, selected: false })))
    setSearchTerm("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Adding Employees to {department.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">
              Employees in {department.parentDepartmentName || "Department"}
            </Label>
            <Input
              id="search"
              placeholder="Filter by name, ID, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="border rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto bg-muted/30">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded">
                  <Checkbox
                    id={emp.id}
                    checked={emp.selected || false}
                    onCheckedChange={() => handleToggleEmployee(emp.id)}
                  />
                  <label htmlFor={emp.id} className="flex-1 cursor-pointer">
                    <p className="font-medium text-sm">{emp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ID: {emp.id} • {emp.position}
                    </p>
                  </label>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No unassigned employees found</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="direct-manager">Direct Manager (Optional)</Label>
            <Select value={selectedManager} onValueChange={setSelectedManager}>
              <SelectTrigger id="direct-manager">
                <SelectValue placeholder="Select department manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mgr-001">Raj Patel (Department Manager)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSubmit} disabled={selectedCount === 0}>
              Save ({selectedCount} selected)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
