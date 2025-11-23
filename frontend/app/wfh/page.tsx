"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Home, Calendar } from "lucide-react"

const mockWFHRequests = [
  {
    id: 1,
    startDate: "2023-12-01",
    endDate: "2023-12-01",
    days: 1,
    status: "Pending",
    reason: "Home maintenance work",
  },
  {
    id: 2,
    startDate: "2023-11-27",
    endDate: "2023-11-29",
    days: 3,
    status: "Approved",
    reason: "Focus on project deliverables",
  },
  { id: 3, startDate: "2023-11-20", endDate: "2023-11-20", days: 1, status: "Approved", reason: "Medical appointment" },
]

export default function WFHPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Work From Home Requests</h1>
          <p className="mt-1 text-slate-600">Submit and track your remote work requests</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          New WFH Request
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Request Work From Home</h2>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input id="start-date" type="date" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input id="end-date" type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason</Label>
                <Textarea id="reason" placeholder="Explain your reason for working from home..." rows={3} />
              </div>
              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> WFH requests should be submitted at least 24 hours in advance. Emergency
                  requests will be reviewed on a case-by-case basis.
                </p>
              </div>
              <div className="flex gap-2">
                <Button className="bg-blue-600 hover:bg-blue-700">Submit Request</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-6 text-lg font-semibold text-slate-900">WFH Request History</h2>
          <div className="space-y-4">
            {mockWFHRequests.map((request) => (
              <div key={request.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-purple-100 p-2">
                      <Home className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900">
                          {new Date(request.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {" - "}
                          {new Date(request.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <Badge
                          variant="outline"
                          className={
                            request.status === "Approved"
                              ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                              : "bg-amber-100 text-amber-700 border-amber-200"
                          }
                        >
                          {request.status}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">
                        <Calendar className="inline h-3 w-3 mr-1" />
                        {request.days} {request.days === 1 ? "day" : "days"}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
