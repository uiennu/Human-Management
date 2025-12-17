"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2, UserPlus, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { employeeApi } from "@/lib/api/employee"
import type { RegisterEmployeeRequest } from "@/types/team"
import { TempPasswordModal } from "@/components/temp-password-modal"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function RegisterEmployeePage() {
    const router = useRouter()
    const { toast } = useToast()
    const [loading, setLoading] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [registrationResult, setRegistrationResult] = useState<{
        employeeId: number
        email: string
        tempPassword: string
    } | null>(null)

    const [formData, setFormData] = useState<RegisterEmployeeRequest>({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        hireDate: format(new Date(), "yyyy-MM-dd"),
        roleID: 1, // Default to IT Employee
        personalEmail: "",
        gender: "",
    })

    const [hireDate, setHireDate] = useState<Date>(new Date())

    const handleInputChange = (field: keyof RegisterEmployeeRequest, value: string | number | undefined) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
            toast({
                title: "Validation Error",
                description: "Please fill in all required fields",
                variant: "destructive",
            })
            return
        }

        setLoading(true)

        try {
            const result = await employeeApi.registerEmployee(formData)

            setRegistrationResult({
                employeeId: result.employeeId,
                email: result.email,
                tempPassword: result.tempPassword,
            })

            setShowPasswordModal(true)

            toast({
                title: "Registration Successful",
                description: `Employee ${formData.firstName} ${formData.lastName} has been registered successfully.`,
            })

            // Reset form
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                address: "",
                hireDate: format(new Date(), "yyyy-MM-dd"),
                roleID: 1,
                personalEmail: "",
                gender: "",
            })
            setHireDate(new Date())
        } catch (error: any) {
            const errorMessage = error.message || "Failed to register employee"
            const isDuplicate = errorMessage.toLowerCase().includes("already exists") || 
                               errorMessage.toLowerCase().includes("duplicate")

            toast({
                title: isDuplicate ? "Duplicate Registration Detected" : "Registration Failed",
                description: isDuplicate 
                    ? "This employee has already been registered. Duplicate registration prevented."
                    : errorMessage,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Register New Employee</CardTitle>
                    <CardDescription>Create a new employee account for the organization</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Personal Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Personal Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">
                                        First Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">
                                        Last Name <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="lastName"
                                        value={formData.lastName}
                                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                                        <SelectTrigger id="gender">
                                            <SelectValue placeholder="Select gender" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold">Contact Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">
                                        Company Email <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="employee@company.com"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="personalEmail">Personal Email</Label>
                                    <Input
                                        id="personalEmail"
                                        type="email"
                                        placeholder="personal@example.com"
                                        value={formData.personalEmail}
                                        onChange={(e) => handleInputChange("personalEmail", e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">
                                        Phone Number <span className="text-destructive">*</span>
                                    </Label>
                                    <Input
                                        id="phone"
                                        placeholder="0901234567"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange("phone", e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Address</Label>
                                <Textarea
                                    id="address"
                                    placeholder="Enter address"
                                    value={formData.address}
                                    onChange={(e) => handleInputChange("address", e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Employment Information */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold">Employment Information</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="hireDate">
                                        Hire Date <span className="text-destructive">*</span>
                                    </Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal",
                                                    !hireDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {hireDate ? format(hireDate, "PPP") : <span>Pick a date</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={hireDate}
                                                onSelect={(date: Date | undefined) => {
                                                    if (date) {
                                                        setHireDate(date)
                                                        handleInputChange("hireDate", format(date, "yyyy-MM-dd"))
                                                    }
                                                }}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="role">
                                        Role <span className="text-destructive">*</span>
                                    </Label>
                                    <Select
                                        value={formData.roleID.toString()}
                                        onValueChange={(value) => handleInputChange("roleID", parseInt(value))}
                                    >
                                        <SelectTrigger id="role">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">IT Employee</SelectItem>
                                            <SelectItem value="2">IT Manager</SelectItem>
                                            <SelectItem value="3">HR Manager</SelectItem>
                                            <SelectItem value="4">HR Employee</SelectItem>
                                            <SelectItem value="5">Admin</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Select
                                        value={formData.departmentID?.toString() || ""}
                                        onValueChange={(value) => handleInputChange("departmentID", value ? parseInt(value) : undefined)}
                                    >
                                        <SelectTrigger id="department">
                                            <SelectValue placeholder="Select department (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Board of Directors</SelectItem>
                                            <SelectItem value="2">Human Resources</SelectItem>
                                            <SelectItem value="3">IT Development</SelectItem>
                                            <SelectItem value="4">Sales & Marketing</SelectItem>
                                            <SelectItem value="5">Finance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="manager">Direct Manager</Label>
                                    <Select
                                        value={formData.managerID?.toString() || ""}
                                        onValueChange={(value) => handleInputChange("managerID", value ? parseInt(value) : undefined)}
                                    >
                                        <SelectTrigger id="manager">
                                            <SelectValue placeholder="Select manager (optional)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">Alice Nguyen</SelectItem>
                                            <SelectItem value="2">Bob Tran</SelectItem>
                                            <SelectItem value="3">Charlie Le</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end gap-3 pt-6 border-t">
                            <Button type="button" variant="outline" onClick={() => router.back()}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating Account...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Create Employee Account
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Temp Password Modal */}
            {registrationResult && (
                <TempPasswordModal
                    open={showPasswordModal}
                    onOpenChange={setShowPasswordModal}
                    employeeId={registrationResult.employeeId}
                    email={registrationResult.email}
                    tempPassword={registrationResult.tempPassword}
                />
            )}
        </div>
    )
}
