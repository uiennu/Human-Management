"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search, UserPlus } from "lucide-react"
import { teamApi } from "@/lib/api/team"
import { employeeApi } from "@/lib/api/employee"
import type { Team } from "@/types/team"
import type { Employee } from "@/types/employee"
import { useToast } from "@/components/ui/use-toast"

interface AddEmployeeToTeamModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    team: Team
    onSuccess: () => void
}

export function AddEmployeeToTeamModal({ open, onOpenChange, team, onSuccess }: AddEmployeeToTeamModalProps) {
    const [searchTerm, setSearchTerm] = useState("")
    const [unassignedIds, setUnassignedIds] = useState<number[]>([])
    const [allEmployees, setAllEmployees] = useState<Employee[]>([])
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (open) {
            loadUnassignedEmployees()
            setSelectedIds(new Set())
            setSearchTerm("")
        }
    }, [open])

    const loadUnassignedEmployees = async () => {
        try {
            setLoading(true)
            const ids = await teamApi.getUnassignedEmployees()
            setUnassignedIds(ids)

            // Fetch full employee details
            // Note: In production, you'd want a batch API endpoint
            const employees = await employeeApi.getAll()
            const unassigned = employees.filter((emp) =>
                ids.includes(parseInt(emp.id))
            )
            setAllEmployees(unassigned)
        } catch (error) {
            console.error("Failed to load unassigned employees:", error)
            toast({
                title: "Error",
                description: "Failed to load unassigned employees",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const filteredEmployees = allEmployees.filter(
        (emp) =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleToggleEmployee = (id: number) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) {
            newSet.delete(id)
        } else {
            newSet.add(id)
        }
        setSelectedIds(newSet)
    }

    const handleSubmit = async () => {
        if (selectedIds.size === 0) return

        setSubmitting(true)
        let successCount = 0
        let failedCount = 0

        try {
            for (const empId of Array.from(selectedIds)) {
                try {
                    await teamApi.addEmployeeToTeam(team.subTeamID, empId)
                    successCount++
                } catch (error) {
                    console.error(`Failed to add employee ${empId}:`, error)
                    failedCount++
                }
            }

            if (successCount > 0) {
                toast({
                    title: "Success",
                    description: `Added ${successCount} employee(s) to ${team.teamName}`,
                })
                onSuccess()
                onOpenChange(false)
            }

            if (failedCount > 0) {
                toast({
                    title: "Partial Success",
                    description: `${successCount} added, ${failedCount} failed`,
                    variant: "destructive",
                })
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to add employees to team",
                variant: "destructive",
            })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Employees to {team.teamName}</DialogTitle>
                    <DialogDescription>
                        Select employees to add to this team. Only unassigned employees are shown.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Search */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Search Employees</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                id="search"
                                placeholder="Search by name, ID, or position..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Employee List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="border rounded-lg p-12 text-center">
                            <p className="text-sm text-muted-foreground">
                                {searchTerm ? "No employees found matching your search" : "No unassigned employees available"}
                            </p>
                        </div>
                    ) : (
                        <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                            {filteredEmployees.map((emp) => {
                                const empId = parseInt(emp.id)
                                const isSelected = selectedIds.has(empId)

                                return (
                                    <div
                                        key={emp.id}
                                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer"
                                        onClick={() => handleToggleEmployee(empId)}
                                    >
                                        <Checkbox checked={isSelected} onCheckedChange={() => handleToggleEmployee(empId)} />

                                        <Avatar className="w-10 h-10">
                                            <AvatarFallback>
                                                {emp.name
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")
                                                    .toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm">{emp.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className="text-xs">
                                                    ID: {emp.id}
                                                </Badge>
                                                {emp.position && (
                                                    <span className="text-xs text-muted-foreground">{emp.position}</span>
                                                )}
                                            </div>
                                            {emp.department && (
                                                <p className="text-xs text-muted-foreground mt-1">{emp.department}</p>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t">
                        <div className="text-sm text-muted-foreground">
                            {selectedIds.size > 0 && `${selectedIds.size} employee(s) selected`}
                        </div>
                        <div className="flex gap-3">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmit}
                                disabled={selectedIds.size === 0 || submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Add {selectedIds.size > 0 ? `(${selectedIds.size})` : ""}
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
