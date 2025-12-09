"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Department {
  id: string
  name: string
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

  // Mock unassigned employees
  const [employees, setEmployees] = useState<Employee[]>([
    { id: "emp-101", name: "Liam Johnson", position: "Software Engineer" },
    { id: "emp-102", name: "Noah Williams", position: "Product Designer" },
    { id: "emp-103", name: "James Brown", position: "QA Tester" },
  ])

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
            <Label htmlFor="search">Unassigned Employees</Label>
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
