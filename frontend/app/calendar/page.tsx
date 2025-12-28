"use client"

import { useEffect, useState, useMemo } from "react"
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar as CalendarIcon,
    User,
    Clock,
    Trash2,
    X,
    Target,
    PartyPopper
} from "lucide-react"
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isToday,
    parseISO
} from "date-fns"
import { utilityApi } from "@/lib/api/utility"
import { employeeApi } from "@/lib/api/employee"
import { organizationService } from "@/lib/api/organization-service"
import { useAuth } from "@/lib/hooks/use-auth"
import { UserRole } from "@/types/auth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export default function UnifiedCalendarPage() {
    const { token, hasAnyRole } = useAuth()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [events, setEvents] = useState<any[]>([])
    const [employees, setEmployees] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState<any>(null)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startTime: "",
        endTime: "",
        type: "PERSONAL",
        userId: "",
        color: "#3b82f6"
    })

    const isAdmin = hasAnyRole([UserRole.Admin, UserRole.HRManager])
    const isManager = hasAnyRole([
        UserRole.ITManager,
        UserRole.HRManager,
        UserRole.SalesManager,
        UserRole.FinanceManager,
        UserRole.Admin
    ])

    const currentUserId = useMemo(() => {
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.EmployeeID || payload.sub;
        } catch { return null; }
    }, [token]);

    const loadData = async () => {
        if (!currentUserId) return;
        setLoading(true)
        try {
            // Fetch events and relevant employees for assignment
            const [eventsData, empData] = await Promise.all([
                utilityApi.getCalendarEvents(Number(currentUserId)),
                isAdmin
                    ? employeeApi.getAll()
                    : (isManager ? organizationService.getSubordinates() : Promise.resolve([]))
            ]);

            // Map employee names for the dropdown
            const mappedEmployees = empData.map((e: any) => {
                const id = e.employeeID?.toString() || e.id?.toString() || e.EmployeeID?.toString();
                let name = e.name || e.Name || (e.firstName && e.lastName ? `${e.firstName} ${e.lastName}` : (e.fullName || "Unknown"));
                if (name === "undefined undefined") name = "Unknown Employee";
                return { id, name };
            });

            setEvents(eventsData)
            setEmployees(mappedEmployees)
        } catch (error) {
            console.error("Sync error:", error);
            toast.error("Failed to sync calendar")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [currentUserId])

    const days = useMemo(() => {
        const start = startOfWeek(startOfMonth(currentDate))
        const end = endOfWeek(endOfMonth(currentDate))
        return eachDayOfInterval({ start, end })
    }, [currentDate])

    const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1))
    const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1))

    const handleDayClick = (day: Date) => {
        setFormData({
            ...formData,
            startTime: format(day, "yyyy-MM-dd'T'09:00"),
            endTime: format(day, "yyyy-MM-dd'T'17:00"),
            userId: currentUserId?.toString() || ""
        })
        setShowModal(true)
        setSelectedEvent(null)
    }

    const handleEventClick = (e: React.MouseEvent, event: any) => {
        e.stopPropagation()
        setSelectedEvent(event)
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const payload = {
                title: formData.title,
                description: formData.description,
                startTime: parseISO(formData.startTime),
                endTime: parseISO(formData.endTime),
                eventType: formData.type,
                userID: formData.type === 'HOLIDAY' ? null : Number(formData.userId),
                createdBy: Number(currentUserId),
                color: formData.color
            }
            await utilityApi.createCalendarEvent(payload)
            toast.success("Event created")
            setShowModal(false)
            loadData()
        } catch (error) {
            toast.error("Failed to create event")
        }
    }

    const handleDelete = async () => {
        if (!selectedEvent) return;
        try {
            await utilityApi.deleteCalendarEvent(selectedEvent.eventID)
            toast.success("Event deleted")
            setShowModal(false)
            loadData()
        } catch (error) {
            toast.error("Failed to delete event")
        }
    }

    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(parseISO(event.startTime), day))
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Header */}
            <header className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/50 backdrop-blur-md">
                <div className="flex items-center gap-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-200">
                        <CalendarIcon className="text-white h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            {format(currentDate, "MMMM yyyy")}
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">Unified Calendar Hub</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex bg-white rounded-xl border border-slate-200 p-1 shadow-sm">
                        <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="rounded-lg hover:bg-slate-100 h-9 w-9 p-0">
                            <ChevronLeft className="h-5 w-5 text-slate-600" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="px-4 text-xs font-bold uppercase tracking-wider text-slate-600">
                            Today
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleNextMonth} className="rounded-lg hover:bg-slate-100 h-9 w-9 p-0">
                            <ChevronRight className="h-5 w-5 text-slate-600" />
                        </Button>
                    </div>
                    <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-200 gap-2 h-11 px-6">
                        <Plus size={18} /> New Event
                    </Button>
                </div>
            </header>

            {/* Grid */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Weekdays */}
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                        <div key={day} className="py-3 text-center">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{day}</span>
                        </div>
                    ))}
                </div>

                {/* Days */}
                <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-auto custom-scrollbar">
                    {days.map((day, i) => {
                        const dayEvents = getEventsForDay(day)
                        const isCurrentMonth = isSameMonth(day, currentDate)

                        return (
                            <div
                                key={i}
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                    "min-h-[120px] p-2 border-r border-b border-slate-50 transition-all hover:bg-slate-50/50 group cursor-pointer relative",
                                    !isCurrentMonth && "bg-slate-50/30 opacity-40",
                                    isToday(day) && "bg-blue-50/30"
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={cn(
                                        "h-8 w-8 flex items-center justify-center text-sm font-bold rounded-lg transition-transform group-hover:scale-110",
                                        isToday(day) ? "bg-blue-600 text-white shadow-md" : "text-slate-600",
                                        !isCurrentMonth && "font-normal"
                                    )}>
                                        {format(day, "d")}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {dayEvents.map(event => (
                                        <div
                                            key={event.eventID}
                                            onClick={(e) => handleEventClick(e, event)}
                                            style={{ backgroundColor: event.color }}
                                            className="px-2 py-1 rounded shadow-sm text-[11px] font-bold truncate transition-all hover:brightness-110 hover:translate-x-1 text-white border-l-2 border-white/20"
                                        >
                                            <div className="flex items-center gap-1">
                                                {event.eventType === 'HOLIDAY' && <PartyPopper size={10} className="shrink-0" />}
                                                {event.eventType === 'DEADLINE' && <Target size={10} className="shrink-0" />}
                                                <span className="truncate">{event.title}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Event Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="bg-blue-600 px-8 py-10 relative overflow-hidden">
                            <div className="absolute top-4 right-4 z-20">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowModal(false);
                                    }}
                                    className="text-white/80 hover:text-white hover:bg-white/20 rounded-full h-10 w-10 p-0 flex items-center justify-center"
                                >
                                    <X size={24} />
                                </Button>
                            </div>
                            <CalendarIcon className="text-white/20 absolute -left-10 -bottom-10 h-64 w-64 rotate-12" />
                            <h2 className="text-3xl font-black text-white relative z-10">
                                {selectedEvent ? "Event Details" : "Create New Event"}
                            </h2>
                            <p className="text-blue-100 text-lg relative z-10 mt-2 font-medium">
                                {selectedEvent ? "View or manage this calendar entry" : "Track holidays, tasks or set deadlines"}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            {selectedEvent ? (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div style={{ backgroundColor: selectedEvent.color }} className="h-10 w-10 rounded-xl flex items-center justify-center">
                                            <Clock className="text-white h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-slate-900 font-black text-xl">{selectedEvent.title}</p>
                                            <p className="text-slate-500 font-medium">{format(parseISO(selectedEvent.startTime), "EEEE, MMM do yyyy")}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">Description</p>
                                        <p className="text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200 italic">
                                            {selectedEvent.description || "No description provided."}
                                        </p>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Badge className={cn(
                                            "px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest",
                                            selectedEvent.eventType === 'HOLIDAY' ? "bg-red-500" :
                                                selectedEvent.eventType === 'DEADLINE' ? "bg-orange-500" : "bg-blue-500"
                                        )}>
                                            {selectedEvent.eventType}
                                        </Badge>
                                        {selectedEvent.eventType !== 'HOLIDAY' && (
                                            <Button variant="ghost" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2 font-bold rounded-xl">
                                                <Trash2 size={18} /> Delete Event
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Event Title</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all font-bold placeholder:text-slate-300"
                                                placeholder="e.g. Finance Report Deadline"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Event Type</label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    type: e.target.value,
                                                    color: e.target.value === 'PERSONAL' ? '#3b82f6' :
                                                        e.target.value === 'HOLIDAY' ? '#ef4444' : '#f97316'
                                                })}
                                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-bold"
                                            >
                                                <option value="PERSONAL">Personal Work</option>
                                                {(isAdmin || isManager) && <option value="DEADLINE">Official Deadline</option>}
                                                {isAdmin && <option value="HOLIDAY">System Holiday</option>}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Assign To</label>
                                            <select
                                                disabled={formData.type === 'PERSONAL' || formData.type === 'HOLIDAY'}
                                                value={formData.userId}
                                                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-bold disabled:opacity-50"
                                            >
                                                <option value={currentUserId || ""}>{formData.type === 'HOLIDAY' ? "All Employees" : "Self"}</option>
                                                {formData.type !== 'HOLIDAY' && (isAdmin || isManager) && employees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Start Date & Time</label>
                                            <input
                                                required
                                                type="datetime-local"
                                                value={formData.startTime}
                                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value, endTime: e.target.value })}
                                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-bold"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 block">Description (Optional)</label>
                                            <textarea
                                                rows={3}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all font-bold placeholder:text-slate-300 resize-none"
                                                placeholder="Any extra details..."
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="flex-1 h-14 rounded-2xl font-bold text-slate-400 hover:bg-slate-50">
                                            Cancel
                                        </Button>
                                        <Button type="submit" className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-xl shadow-blue-200 transition-all hover:scale-[1.02]">
                                            Save Event
                                        </Button>
                                    </div>
                                </>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
