// API service for departments
import type { Department } from "@/types/department";

export const departmentApi = {
  async getAll(): Promise<Department[]> {
    // TODO: Call backend API
    return [];
  },
  async getById(id: string): Promise<Department | null> {
    // TODO: Call backend API
    return null;
  },
  // Add more methods as needed (create, update, delete)
};
