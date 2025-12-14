"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserPlus, Users, Mail, Trash2 } from "lucide-react"
import { teamApi } from "@/lib/api/team"
import type { Team } from "@/types/team"
import { AddEmployeeToTeamModal } from "@/components/add-employee-to-team-modal"
import { useToast } from "@/components/ui/use-toast"

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [unassignedCount, setUnassignedCount] = useState(0)
    const { toast } = useToast()

    useEffect(() => {
        loadTeams()
        loadUnassignedCount()
    }, [])

    const loadTeams = async () => {
        try {
            setLoading(true)
            const data = await teamApi.getTeams()
            setTeams(data)
        } catch (error) {
            console.error("Failed to load teams:", error)
            toast({
                title: "Error",
                description: "Failed to load teams",
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    const loadUnassignedCount = async () => {
        try {
            const unassigned = await teamApi.getUnassignedEmployees()
            setUnassignedCount(unassigned.length)
        } catch (error) {
            console.error("Failed to load unassigned count:", error)
        }
    }

    const handleAddEmployee = (team: Team) => {
        setSelectedTeam(team)
        setIsAddModalOpen(true)
    }

    const handleRemoveEmployee = async (teamId: number, employeeId: number, employeeName: string) => {
        if (!confirm(`Remove ${employeeName} from this team?`)) {
            return
        }

        try {
            await teamApi.removeEmployeeFromTeam(teamId, employeeId)
            toast({
                title: "Success",
                description: `${employeeName} removed from team`,
            })
            loadTeams()
            loadUnassignedCount()
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to remove employee",
                variant: "destructive",
            })
        }
    }

    const handleModalSuccess = () => {
        loadTeams()
        loadUnassignedCount()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-muted-foreground">Loading teams...</div>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground">Manage team members and assignments</p>
                </div>
                {unassignedCount > 0 && (
                    <Badge variant="secondary" className="text-sm">
                        <Users className="w-4 h-4 mr-1" />
                        {unassignedCount} Unassigned
                    </Badge>
                )}
            </div>

            {/* Teams Grid */}
            {teams.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No teams found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team) => (
                        <Card key={team.subTeamID} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-xl">{team.teamName}</CardTitle>
                                        <CardDescription className="mt-1">
                                            {team.departmentName || "No Department"}
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline">{team.memberCount} members</Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Team Lead */}
                                {team.teamLeadName && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">Lead:</span>
                                        <span className="font-medium">{team.teamLeadName}</span>
                                    </div>
                                )}

                                {/* Description */}
                                {team.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{team.description}</p>
                                )}

                                {/* Members List */}
                                {team.members.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Members</div>
                                        <div className="space-y-1 max-h-48 overflow-y-auto">
                                            {team.members.map((member) => (
                                                <div
                                                    key={member.employeeID}
                                                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group"
                                                >
                                                    <Avatar className="w-8 h-8">
                                                        <AvatarFallback className="text-xs">
                                                            {member.firstName[0]}
                                                            {member.lastName[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">
                                                            {member.firstName} {member.lastName}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                                            <Mail className="w-3 h-3" />
                                                            {member.email}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={() =>
                                                            handleRemoveEmployee(
                                                                team.subTeamID,
                                                                member.employeeID,
                                                                `${member.firstName} ${member.lastName}`
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Add Employee Button */}
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => handleAddEmployee(team)}
                                >
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Add Member
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Employee Modal */}
            {selectedTeam && (
                <AddEmployeeToTeamModal
                    open={isAddModalOpen}
                    onOpenChange={setIsAddModalOpen}
                    team={selectedTeam}
                    onSuccess={handleModalSuccess}
                />
            )}
        </div>
    )
}
