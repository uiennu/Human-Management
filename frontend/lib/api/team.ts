// Team management API service
import type {
    Team,
    AddEmployeeToTeamRequest,
    AddEmployeeToTeamResponse,
    RemoveEmployeeResponse,
    UnassignedEmployeesResponse,
} from "@/types/team";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5204";

function getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

export const teamApi = {
    /**
     * Get all teams with members
     */
    async getTeams(): Promise<Team[]> {
        const res = await fetch(`${API_URL}/api/organization/teams`, {
            headers: getAuthHeaders(),
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch teams: ${res.statusText}`);
        }

        return res.json();
    },

    /**
     * Get list of unassigned employees (employee IDs)
     */
    async getUnassignedEmployees(): Promise<number[]> {
        const res = await fetch(`${API_URL}/api/organization/unassigned-employees`, {
            headers: getAuthHeaders(),
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch unassigned employees: ${res.statusText}`);
        }

        const data: UnassignedEmployeesResponse = await res.json();
        return data.unassignedEmployees;
    },

    /**
     * Add employee to team
     */
    async addEmployeeToTeam(
        teamId: number,
        employeeId: number
    ): Promise<AddEmployeeToTeamResponse> {
        const requestBody: AddEmployeeToTeamRequest = { employeeId };

        const res = await fetch(`${API_URL}/api/organization/teams/${teamId}/add-employee`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to add employee to team");
        }

        return res.json();
    },

    /**
     * Remove employee from team
     */
    async removeEmployeeFromTeam(
        teamId: number,
        employeeId: number
    ): Promise<RemoveEmployeeResponse> {
        const res = await fetch(
            `${API_URL}/api/organization/teams/${teamId}/remove-employee/${employeeId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders(),
            }
        );

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || "Failed to remove employee from team");
        }

        return res.json();
    },
};
