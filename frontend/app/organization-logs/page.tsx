"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, User, FileJson } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface OrganizationLog {
    logID: number
    eventType: string
    targetEntity: string
    targetID: number
    eventData: string // JSON string
    performedBy: number
    performedByName: string
    performedAt: string
}

export default function OrganizationLogsPage() {
    const router = useRouter()
    const [logs, setLogs] = useState<OrganizationLog[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedLog, setExpandedLog] = useState<number | null>(null)

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:5204/api/organization/logs", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error("Failed to fetch logs")
            }

            const data = await response.json()
            setLogs(data)
        } catch (error: any) {
            toast.error(error.message || "Failed to load organization logs")
        } finally {
            setLoading(false)
        }
    }

    const getEventTypeBadgeColor = (eventType: string) => {
        const colors: Record<string, string> = {
            CreateSubTeam: "bg-green-500",
            UpdateSubTeam: "bg-blue-500",
            DeleteSubTeam: "bg-red-500",
            CreateDepartment: "bg-green-600",
            UpdateDepartment: "bg-blue-600",
            DeleteDepartment: "bg-red-600",
            AssignToSubTeam: "bg-purple-500",
            RemoveEmployeeFromTeam: "bg-orange-500",
            ChangeDeptManager: "bg-indigo-500",
            ChangeTeamLead: "bg-pink-500",
        }
        return colors[eventType] || "bg-gray-500"
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatJSON = (jsonString: string) => {
        try {
            const parsed = JSON.parse(jsonString)
            return JSON.stringify(parsed, null, 2)
        } catch {
            return jsonString
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading logs...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            {/* Header */}
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Organization
                </Button>
                <h1 className="text-3xl font-bold text-gray-900">Organization Activity Logs</h1>
                <p className="text-gray-600 mt-2">View all organization changes and activities</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{logs.length}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Event Types</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold">{new Set(logs.map((l) => l.eventType)).size}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Latest Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600">
                            {logs.length > 0 ? formatDate(logs[0].performedAt) : "No activity"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Logs List */}
            <div className="space-y-4">
                {logs.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <p className="text-gray-500">No organization logs found</p>
                        </CardContent>
                    </Card>
                ) : (
                    logs.map((log) => (
                        <Card key={log.logID} className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge className={`${getEventTypeBadgeColor(log.eventType)} text-white`}>
                                                {log.eventType}
                                            </Badge>
                                            <span className="text-sm text-gray-500">
                                                {log.targetEntity} #{log.targetID}
                                            </span>
                                        </div>
                                        <CardTitle className="text-lg">Log #{log.logID}</CardTitle>
                                        <CardDescription className="flex items-center gap-4 mt-2">
                                            <span className="flex items-center gap-1">
                                                <User className="h-4 w-4" />
                                                {log.performedByName || `User #${log.performedBy}`}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(log.performedAt)}
                                            </span>
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setExpandedLog(expandedLog === log.logID ? null : log.logID)}
                                    >
                                        <FileJson className="h-4 w-4 mr-2" />
                                        {expandedLog === log.logID ? "Hide" : "View"} JSON
                                    </Button>
                                </div>
                            </CardHeader>

                            {expandedLog === log.logID && (
                                <CardContent>
                                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                                        <pre className="text-sm font-mono">{formatJSON(log.eventData)}</pre>
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
