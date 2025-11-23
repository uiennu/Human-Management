import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, MapPin, Calendar, Briefcase, Edit } from "lucide-react"

const employeeProfile = {
  name: "John Doe",
  email: "john.doe@company.com",
  phone: "+1 (555) 123-4567",
  position: "Software Engineer",
  department: "Engineering",
  employeeId: "EMP-2023-001",
  joinDate: "January 15, 2023",
  manager: "Jane Smith",
  location: "San Francisco, CA",
  leaveBalance: {
    annual: 15,
    sick: 10,
    personal: 3,
  },
}

export default function ProfilePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>
        <Button variant="outline">
          <Edit className="mr-2 h-4 w-4" />
          Edit Profile
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-32 w-32">
                <AvatarImage src="/professional-portrait.png" alt={employeeProfile.name} />
                <AvatarFallback className="bg-blue-600 text-3xl text-white">JD</AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-2xl font-bold text-slate-900">{employeeProfile.name}</h2>
              <p className="text-slate-600">{employeeProfile.position}</p>
              <Badge className="mt-2 bg-blue-600">{employeeProfile.department}</Badge>
              <div className="mt-6 w-full space-y-3 text-left">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="h-4 w-4" />
                  {employeeProfile.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="h-4 w-4" />
                  {employeeProfile.phone}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4" />
                  {employeeProfile.location}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details Cards */}
        <div className="space-y-6 lg:col-span-2">
          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-slate-600">Employee ID</p>
                  <p className="mt-1 text-slate-900">{employeeProfile.employeeId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Join Date</p>
                  <div className="mt-1 flex items-center gap-1 text-slate-900">
                    <Calendar className="h-4 w-4" />
                    {employeeProfile.joinDate}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Department</p>
                  <div className="mt-1 flex items-center gap-1 text-slate-900">
                    <Briefcase className="h-4 w-4" />
                    {employeeProfile.department}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600">Manager</p>
                  <p className="mt-1 text-slate-900">{employeeProfile.manager}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Leave Balance */}
          <Card>
            <CardHeader>
              <CardTitle>Leave Balance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4">
                  <p className="text-sm font-medium text-blue-900">Annual Leave</p>
                  <p className="mt-2 text-3xl font-bold text-blue-900">{employeeProfile.leaveBalance.annual}</p>
                  <p className="text-xs text-blue-700">days remaining</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-900">Sick Leave</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-900">{employeeProfile.leaveBalance.sick}</p>
                  <p className="text-xs text-emerald-700">days remaining</p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4">
                  <p className="text-sm font-medium text-purple-900">Personal Days</p>
                  <p className="mt-2 text-3xl font-bold text-purple-900">{employeeProfile.leaveBalance.personal}</p>
                  <p className="text-xs text-purple-700">days remaining</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>This Year Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                  <div>
                    <p className="text-sm text-slate-600">Total Leaves Taken</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">5</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                  <div>
                    <p className="text-sm text-slate-600">Pending Requests</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">2</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                  <div>
                    <p className="text-sm text-slate-600">WFH Days</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">8</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4">
                  <div>
                    <p className="text-sm text-slate-600">Overtime Hours</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">24h</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
