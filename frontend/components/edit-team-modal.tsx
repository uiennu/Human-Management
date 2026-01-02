"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { organizationService } from "@/lib/api/organization-service"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Department {
    id: string
    name: string
    code: string
    manager: string
    managerId: string
    description: string
}

interface EditTeamModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    department: Department
    onSubmit: (dept: Department) => void
}

export function EditTeamModal({ open, onOpenChange, department, onSubmit }: EditTeamModalProps) {
    const [formData, setFormData] = useState(department)

    useEffect(() => {
        setFormData(department)
    }, [department])

    const [managers, setManagers] = useState<{ id: string; name: string }[]>([])

    useEffect(() => {
        let mounted = true
        ;(async () => {
            try {
                const emps = await organizationService.getAllEmployees()
                if (!mounted) return
                setManagers(emps.map(e => ({ id: String(e.employeeID), name: e.name })))
            } catch (err) {
                console.error("Failed to load managers", err)
            }
        })()
        return () => {
            mounted = false
        }
    }, [])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (formData.name && formData.code && formData.managerId) {
            onSubmit(formData)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Team</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-team-name">Team Name *</Label>
                            <Input
                                id="edit-team-name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-team-code">Team Code *</Label>
                            <Input
                                id="edit-team-code"
                                value={formData.code}
                                disabled
                                className="bg-gray-100 text-gray-500 cursor-not-allowed"
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-team-description">Description</Label>
                        <Textarea
                            id="edit-team-description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="edit-team-manager">Team Manager *</Label>
                        <Select
                            value={formData.managerId}
                            onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                        >
                            <SelectTrigger id="edit-team-manager">
                                <SelectValue />
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
