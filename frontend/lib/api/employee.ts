// API service for employees
import type {
  RegisterEmployeeRequest,
  RegisterEmployeeResponse,
  Role,
  Department,
  Manager,
} from "@/types/team";
import type { Employee } from "@/types/employee";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5204";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

export const employeeApi = {
  /**
   * Register a new employee (HR/Admin only)
   */
  async registerEmployee(data: RegisterEmployeeRequest): Promise<RegisterEmployeeResponse> {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to register employee");
    }

    return res.json();
  },

  /**
   * Get all employees
   */
  async getAll(): Promise<Employee[]> {
    const res = await fetch(`${API_URL}/api/organization/employees`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch employees");
    }

    const data = await res.json();

    // Map backend DTO to frontend interface
    return data.map((e: any) => ({
      id: e.employeeID.toString(),
      name: `${e.firstName} ${e.lastName}`,
      position: e.position || "Employee",
      hireDate: e.hireDate,
      status: e.isActive ? "Active" : "Terminated",
      department: e.departmentName || "Unassigned"
    }));
  },

  /**
   * Get employee by ID
   */
  async getById(id: string): Promise<Employee | null> {
    const res = await fetch(`${API_URL}/api/employees/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  },

  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    const res = await fetch(`${API_URL}/api/organization/roles`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch roles");
    }

    return res.json();
  },

  /**
   * Get all departments
   */
  async getDepartments(): Promise<Department[]> {
    const res = await fetch(`${API_URL}/api/organization/departments`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch departments");
    }

    return res.json();
  },

  /**
   * Get potential managers (employees with manager roles)
   */
  async getManagers(): Promise<Manager[]> {
    const res = await fetch(`${API_URL}/api/organization/managers`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch managers");
    }

    return res.json();
  },

  /**
   * Get registration history (all EmployeeCreated events)
   */
  async getRegistrationHistory(): Promise<RegistrationEvent[]> {
    const res = await fetch(`${API_URL}/api/auth/registration-history`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      throw new Error("Failed to fetch registration history");
    }

    return res.json();
  },
};

export interface RegistrationEvent {
  eventID: number;
  employeeID: number;
  eventType: string;
  eventData: string; // JSON string
  version: number;
  createdBy: number | null;
  createdAt: string;
}

