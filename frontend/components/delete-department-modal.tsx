"use client"

import type React from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DeleteDepartmentModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    departmentName: string
    onConfirm: () => void
    type?: "Department" | "Team"
}

export function DeleteDepartmentModal({ open, onOpenChange, departmentName, onConfirm, type = "Department" }: DeleteDepartmentModalProps) {
    const handleConfirm = () => {
        onConfirm()
        onOpenChange(false)
    }
    const typeText = type.toLowerCase();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* SỬA LỖI Ở ĐÂY:
                1. Đã xóa prop 'showCloseButton={false}' gây lỗi.
                2. Thêm class '[&>button]:hidden' vào className để ẩn nút "X" mặc định của DialogContent.
            */}
            <DialogContent className="sm:max-w-md p-8 [&>button]:hidden">
                <div className="flex flex-col items-center text-center">
                    {/* Biểu tượng cảnh báo lớn màu đỏ */}
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 border border-red-300">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>

                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold mb-2 text-center">Confirm Deletion</DialogTitle>
                    </DialogHeader>

                    {/* Nội dung cảnh báo */}
                    <div className="text-sm text-gray-500 mb-6">
                        Are you sure you want to delete the <span className="font-bold text-gray-900">{departmentName}</span> {typeText}?
                        <br />
                        This action cannot be undone. All employees in this {typeText} will be unassigned.
                    </div>

                    {/* Các nút hành động */}
                    <div className="flex w-full justify-center gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="min-w-[120px]"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]"
                        >
                            Confirm
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}