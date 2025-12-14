// Team management types
export interface Team {
    subTeamID: number;
    teamName: string;
    description: string | null;
    departmentID: number;
    departmentName: string | null;
    teamLeadID: number | null;
    teamLeadName: string | null;
    memberCount: number;
    members: TeamMember[];
}

export interface TeamMember {
    employeeID: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    departmentID: number | null;
    departmentName: string | null;
}

export interface AddEmployeeToTeamRequest {
    employeeId: number;
}

export interface AddEmployeeToTeamResponse {
    employeeId: number;
}

export interface RemoveEmployeeResponse {
    success: boolean;
    message: string;
    data: {
        employeeId: number;
        teamId: number;
    } | null;
}

export interface UnassignedEmployeesResponse {
    unassignedEmployees: number[];
}

// Employee registration types
export interface RegisterEmployeeRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address?: string;
    hireDate: string; // ISO date string
    departmentID?: number;
    managerID?: number;
    roleID: number;
    personalEmail?: string;
    gender?: string;
}

export interface RegisterEmployeeResponse {
    employeeId: number;
    email: string;
    tempPassword: string;
    message: string;
}

export interface Role {
    roleID: number;
    roleName: string;
}

export interface Department {
    departmentID: number;
    departmentName: string;
    departmentCode: string | null;
}

export interface Manager {
    employeeID: number;
    firstName: string;
    lastName: string;
    email: string;
    departmentID: number | null;
}
