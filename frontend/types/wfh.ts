export interface WFHRequest {
  id: number
  startDate: string
  endDate: string
  days: number
  status: "Approved" | "Pending" | "Rejected"
  reason: string
  submittedDate: string
}

export interface CreateWFHRequest {
  startDate: string
  endDate: string
  reason: string
}
