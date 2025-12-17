"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, UserPlus, Calendar, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { employeeApi, type RegistrationEvent } from "@/lib/api/employee"
import { RequireRole } from "@/components/require-role"
import { UserRole } from "@/types/auth"

interface EmployeeData {
  employeeID: number
  firstName: string
  lastName: string
  email: string
  phone?: string
  hireDate: string
  departmentID?: number
  managerID?: number
}

export default function RegistrationHistoryPage() {
  const router = useRouter()
  const [events, setEvents] = useState<RegistrationEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const data = await employeeApi.getRegistrationHistory()
      setEvents(data)
    } catch (error) {
      console.error("Error fetching registration history:", error)
    } finally {
      setLoading(false)
    }
  }

  const parseEventData = (dataString: string): EmployeeData | null => {
    try {
      const parsed = JSON.parse(dataString)
      // Normalize to camelCase (handle both PascalCase from C# and camelCase)
      return {
        employeeID: parsed.EmployeeID || parsed.employeeID,
        firstName: parsed.FirstName || parsed.firstName || "",
        lastName: parsed.LastName || parsed.lastName || "",
        email: parsed.Email || parsed.email || "",
        phone: parsed.Phone || parsed.phone,
        hireDate: parsed.HireDate || parsed.hireDate || "",
        departmentID: parsed.DepartmentID || parsed.departmentID,
        managerID: parsed.ManagerID || parsed.managerID,
      }
    } catch (error) {
      console.error("Error parsing event data:", error, dataString)
      return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-600">Loading registration history...</p>
        </div>
      </div>
    )
  }

  return (
    <RequireRole roles={[UserRole.Admin]}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">Registration History</h1>
            </div>
            <Badge variant="outline" className="text-sm">
              {events.length} Registrations
            </Badge>
          </div>

          {/* Timeline */}
          {events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <UserPlus className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">No registration history available</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const employeeData = parseEventData(event.eventData)
                if (!employeeData) return null
                
                // Use event.employeeID (AggregateID) as fallback
                const employeeId = employeeData.employeeID || event.employeeID

                return (
                  <Card key={event.eventID} className="overflow-hidden">
                    <CardHeader className="bg-white pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            <UserPlus className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              <Badge className="bg-green-100 text-green-800">
                                {event.eventType}
                              </Badge>
                            </CardTitle>
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(event.createdAt)}</span>
                              <span className="text-gray-400">•</span>
                              <span>Version {event.version}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Employee ID - Always show */}
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-gray-600">Employee ID:</span>
                          <span className="text-gray-900 font-semibold">
                            {employeeId || "N/A"}
                          </span>
                        </div>
                        
                        {/* Name - Prominently displayed */}
                        {employeeData.firstName && employeeData.lastName && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600">Name:</span>
                            <span className="text-gray-900 font-semibold text-base">
                              {employeeData.firstName} {employeeData.lastName}
                            </span>
                          </div>
                        )}
                        
                        {/* Email - Prominently displayed */}
                        {employeeData.email && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600">Email:</span>
                            <span className="text-gray-900 font-semibold">
                              {employeeData.email}
                            </span>
                          </div>
                        )}
                        
                        {/* Phone */}
                        {employeeData.phone && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600">Phone:</span>
                            <span className="text-gray-900">
                              {employeeData.phone}
                            </span>
                          </div>
                        )}
                        
                        {/* Hire Date */}
                        {employeeData.hireDate && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-600">Hire Date:</span>
                            <span className="text-gray-900">
                              {new Date(employeeData.hireDate).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </RequireRole>
  )
}

