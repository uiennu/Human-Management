"use client"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface RemoveEmployeeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employeeName: string
    teamName: string
    onConfirm: () => void
}

export function RemoveEmployeeModal({
    open,
    onOpenChange,
    employeeName,
    teamName,
    onConfirm,
}: RemoveEmployeeModalProps) {
    const handleConfirm = () => {
        onConfirm()
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                        </div>
                        <DialogTitle>Remove Employee</DialogTitle>
                    </div>
                    <DialogDescription className="pt-3">
                        Are you sure you want to remove <span className="font-semibold text-gray-900">{employeeName}</span> from{" "}
                        <span className="font-semibold text-gray-900">{teamName}</span>?
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleConfirm}>
                        Remove Employee
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
