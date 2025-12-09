// Department types for HRM system
export interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  manager: string;
  managerId: string;
  employees: import("./employee").Employee[];
  subdepartments?: Department[];
}
