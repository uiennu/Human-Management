"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddSubTeamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function AddSubTeamModal({ open, onOpenChange, onSubmit }: AddSubTeamModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    managerId: "",
    manager: "",
  })

  // Mock data
  const managers = [
    { id: "sqd-001", name: "David Lee" },
    { id: "sqd-002", name: "Emily Carter" },
    { id: "sqd-003", name: "Michael Brown" },
    { id: "sqd-004", name: "Sarah Johnson" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name && formData.code && formData.managerId) {
      const selectedManager = managers.find((m) => m.id === formData.managerId)
      onSubmit({
        ...formData,
        manager: selectedManager?.name || "",
      })
      setFormData({ name: "", code: "", description: "", managerId: "", manager: "" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Sub-team</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sub-name">Sub-team Name *</Label>
              <Input
                id="sub-name"
                placeholder="e.g. Mobile Squad"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sub-code">Sub-team Code *</Label>
              <Input
                id="sub-code"
                placeholder="e.g. MOB"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-description">Description</Label>
            <Textarea
              id="sub-description"
              placeholder="Enter a short description for the sub-team"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sub-lead">Squad Lead *</Label>
            <Select
              value={formData.managerId}
              onValueChange={(value) => setFormData({ ...formData, managerId: value })}
            >
              <SelectTrigger id="sub-lead">
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
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}