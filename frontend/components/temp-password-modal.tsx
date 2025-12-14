"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, Copy, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface TempPasswordModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employeeId: number
    email: string
    tempPassword: string
}

export function TempPasswordModal({
    open,
    onOpenChange,
    employeeId,
    email,
    tempPassword,
}: TempPasswordModalProps) {
    const router = useRouter()
    const { toast } = useToast()
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(tempPassword)
        setCopied(true)
        toast({
            title: "Copied!",
            description: "Temporary password copied to clipboard",
        })
        setTimeout(() => setCopied(false), 2000)
    }

    const handleClose = () => {
        onOpenChange(false)
        // Optionally navigate somewhere
        // router.push("/organization/employees")
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <DialogTitle>Employee Created Successfully</DialogTitle>
                    </div>
                    <DialogDescription>
                        Please share the temporary password with the new employee securely.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Employee Info */}
                    <div className="rounded-lg border p-4 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Employee ID</span>
                            <Badge variant="outline">{employeeId}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Email</span>
                            <span className="text-sm font-medium">{email}</span>
                        </div>
                    </div>

                    {/* Temporary Password */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Temporary Password</label>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 px-4 py-3 bg-muted rounded-md font-mono text-sm select-all">
                                {tempPassword}
                            </div>
                            <Button size="sm" variant="outline" onClick={handleCopy}>
                                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    {/* Warning */}
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            <strong>Important:</strong> This password will only be shown once. Please save it securely and share
                            it with the employee through a secure channel. The employee should change this password on first
                            login.
                        </AlertDescription>
                    </Alert>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button onClick={handleClose}>Done</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
