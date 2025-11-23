"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"

export default function CheckInPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <MapPin className="mb-4 h-16 w-16 text-slate-300" />
          <h2 className="mb-2 text-2xl font-semibold text-slate-900">Feature In Progress</h2>
          <p className="text-slate-600">Check-in/out requests will be available soon.</p>
        </CardContent>
      </Card>
    </div>
  )
}
