// Employee types for HRM system
export interface Employee {
  id: string;
  name: string;
  position: string;
  hireDate: string;
  status: "Active" | "On Leave" | "Terminated";
  department: string;
}
