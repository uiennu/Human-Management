"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface MoveEmployeeModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employeeName: string
    sourceTeamName: string
    targetTeamName: string
    onConfirm: () => void
}

export function MoveEmployeeModal({
    open,
    onOpenChange,
    employeeName,
    sourceTeamName,
    targetTeamName,
    onConfirm,
}: MoveEmployeeModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Move</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to move <strong>{employeeName}</strong> from{" "}
                        <strong>{sourceTeamName}</strong> to <strong>{targetTeamName}</strong>?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onConfirm}>Confirm</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
