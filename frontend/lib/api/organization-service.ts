import axios from "axios";
export interface DepartmentDto {
    departmentID: number
    departmentName: string
    departmentCode: string
}

export interface TeamResponseDto {
    subTeamID: number
    teamName: string
    description: string
    departmentID: number
    departmentName: string
    teamLeadID: number | null
    teamLeadName: string | null
    memberCount: number
    members: TeamMemberDto[]
}

export interface TeamMemberDto {
    employeeID: number
    firstName: string
    lastName: string
    email: string
    phone: string | null
    departmentID: number | null
    departmentName: string | null
    // We can add position/avatar if available or needed
    position: string | null
}

export interface EmployeeDto {
    employeeID: number
    name: string
    email?: string
    departmentName: string | null
    position?: string
    avatar?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5204/api'

function getAuthHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : ''
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    }
}

export const organizationService = {
    async getAllDepartments(): Promise<DepartmentDto[]> {
        const res = await fetch(`${API_URL}/organization/departments`, {
            headers: getAuthHeaders(),
        })
        if (!res.ok) throw new Error('Failed to fetch departments')
        return res.json()
    },

    async getAllTeams(): Promise<TeamResponseDto[]> {
        const res = await fetch(`${API_URL}/organization/teams`, {
            headers: getAuthHeaders(),
        })
        if (!res.ok) throw new Error('Failed to fetch teams')
        return res.json()
    },

    async getAllEmployees(): Promise<EmployeeDto[]> {
        const res = await fetch(`${API_URL}/organization/employees`, {
            headers: getAuthHeaders(),
        })
        if (!res.ok) throw new Error('Failed to fetch employees')
        return res.json()
    },

    async createTeam(departmentId: number, data: { teamName: string; description?: string; teamLeadId?: number | null }) {
        const res = await fetch(`${API_URL}/organization/departments/${departmentId}/teams`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        })

        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.message || "Failed to create team")
        }
        return res.json()
    },

    async createDepartment(data: { name: string; departmentCode: string; description?: string; managerId?: number | null }) {
        const res = await fetch(`${API_URL}/organization/adddepartment`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        })

        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.message || "Failed to create department")
        }
        return res.json()
    },

    async deleteDepartment(id: number) {
        const res = await fetch(`${API_URL}/organization/deletedepartment/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        })

        // Xử lý lỗi từ Backend trả về (ví dụ: 409 Conflict nếu còn nhân viên)
        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.message || 'Failed to delete department')
        }
        return res.json()
    },

    async createTeam(departmentId: number, data: { teamName: string; description: string; teamLeadId?: number }) {
        const res = await fetch(`${API_URL}/organization/addteam/${departmentId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data),
        })
        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.message || 'Failed to create team')
        }
        return res.json()
    },

    async deleteTeam(id: number) {
        const res = await fetch(`${API_URL}/organization/deleteteam/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        })
        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.message || 'Failed to delete team')
        }
        return res.json()
    },

    updateDepartment: async (id: number, data: any) => {
    // data ở đây sẽ bao gồm: name, code, description, managerId
    await axios.put(`${API_URL}/organization/departments/${id}`, data);
  },
}
