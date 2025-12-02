"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Calendar, Clock, FileText, Eye, FileImage, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { leaveService } from "@/lib/services/leaveService"

interface LeaveRequestDetailProps {
  request: any;
  onBack: () => void;
}

export default function LeaveRequestDetail({ request, onBack }: LeaveRequestDetailProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const data = await leaveService.getLeaveRequestDetail(request.leaveRequestID);
        setDetails(data);
      } catch (error) {
        console.error("Failed to load details", error);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [request]);

  if (loading) return <div className="p-8 text-center">Loading details...</div>;
  if (!details) return <div className="p-8 text-center text-red-500">Failed to load details</div>;

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5204';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">Request Details</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{details.leaveType.name}</span>
              <Badge variant="outline" className="text-base px-3 py-1">
                {details.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Start Date
                </p>
                <p className="text-slate-900 font-medium">
                  {new Date(details.startDate).toLocaleDateString()}
                  {details.isHalfDayStart && " (Half Day)"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> End Date
                </p>
                <p className="text-slate-900 font-medium">
                  {new Date(details.endDate).toLocaleDateString()}
                  {details.isHalfDayEnd && " (Half Day)"}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Total Duration
              </p>
              <p className="text-slate-900 font-medium">{details.totalDays} Days</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Reason
              </p>
              <div className="bg-slate-50 p-4 rounded-md text-slate-700 text-sm">
                {details.reason || "No reason provided."}
              </div>
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-500">Attachments</p>
              {details.attachments && details.attachments.length > 0 ? (
                <div className="space-y-4">
                  {/* Image Grid */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {details.attachments.filter((path: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(path)).map((path: string, index: number) => {
                      const fileName = path.split('/').pop();
                      return (
                        <div
                          key={index}
                          className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                          onClick={() => setSelectedImage(`${API_BASE}/${path}`)}
                        >
                          <img
                            src={`${API_BASE}/${path}`}
                            alt={fileName}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                            <Eye className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* File List (Non-images or all files) */}
                  <ul className="space-y-2">
                    {details.attachments.map((path: string, index: number) => {
                      const fileName = path.split('/').pop();
                      const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
                      return (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <a
                            href={`${API_BASE}/${path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {isImage ? <FileImage className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                            {fileName}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No attachments</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative pl-4 border-l-2 border-slate-200 pb-4">
                <div className="absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full bg-blue-500" />
                <p className="text-sm font-medium text-slate-900">Request Submitted</p>
                <p className="text-xs text-slate-500">
                  {new Date(details.requestedDate).toLocaleString()}
                </p>
              </div>
              {/* Add more timeline items here based on history if available */}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-lg shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute right-2 top-2 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}