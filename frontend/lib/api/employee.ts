// API service for employees
import type { Employee } from "@/types/employee";

export const employeeApi = {
  async getAll(): Promise<Employee[]> {
    // TODO: Call backend API
    return [];
  },
  async getById(id: string): Promise<Employee | null> {
    // TODO: Call backend API
    return null;
  },
  // Add more methods as needed (create, update, delete)
};
