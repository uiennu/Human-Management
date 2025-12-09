"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface AddTeamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: any) => void
}

export function AddTeamModal({ open, onOpenChange, onSubmit }: AddTeamModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    managerId: "",
    manager: "",
  })

  // Mock data - In real app fetch leads suitable for Teams
  const managers = [
    { id: "lead-001", name: "David Lee" },
    { id: "lead-002", name: "Emily Carter" },
    { id: "lead-003", name: "Michael Brown" },
    { id: "lead-004", name: "Sarah Johnson" },
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
          <DialogTitle>Add Team</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                placeholder="e.g. QA Team"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-code">Team Code *</Label>
              <Input
                id="team-code"
                placeholder="e.g. QA01"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-description">Description</Label>
            <Textarea
              id="team-description"
              placeholder="Enter a short description for the team"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-lead">Team Lead *</Label>
            <Select
              value={formData.managerId}
              onValueChange={(value) => setFormData({ ...formData, managerId: value })}
            >
              <SelectTrigger id="team-lead">
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