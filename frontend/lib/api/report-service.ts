import { axiosInstance } from "@/lib/api/axios-instance";

// Interface định nghĩa bộ lọc báo cáo
export interface EmployeeReportFilter {
    department: string;
    subTeam?: string;
    searchTerm?: string;
    hireDateFrom?: Date;
    hireDateTo?: Date;
    selectedStatuses?: string[];
    page?: number;
    pageSize?: number;
}

export const reportService = {
    // 1. Lấy dữ liệu báo cáo (JSON) để hiển thị lên bảng (Table)
    getEmployeeReport: async (filter: EmployeeReportFilter) => {
        try {
            const response = await axiosInstance.post('/reports/employees', {
                department: filter.department,
                subTeam: filter.subTeam,
                searchTerm: filter.searchTerm,
                hireDateFrom: filter.hireDateFrom,
                hireDateTo: filter.hireDateTo,
                selectedStatuses: filter.selectedStatuses,
                page: filter.page || 1,
                pageSize: filter.pageSize || 10
            });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch report data:", error);
            throw error;
        }
    },

    // 2. Lấy danh sách phòng ban cho Dropdown
    getDepartments: async () => {
        try {
            const response = await axiosInstance.get('/reports/departments');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch departments:", error);
            throw error;
        }
    },

    // 3. Lấy danh sách SubTeam cho Dropdown (có thể lọc theo Department)
    getSubTeams: async (department?: string) => {
        try {
            // Nếu có department thì thêm param, nếu không thì gọi không param (backend tự xử lý)
            const url = department
                ? `/reports/subteams?department=${encodeURIComponent(department)}`
                : '/reports/subteams';

            const response = await axiosInstance.get(url);
            return response.data;
        } catch (error) {
            console.error("Failed to fetch subteams:", error);
            throw error;
        }
    },

    // 4. Hàm Export Báo Cáo (Excel/PDF)
    exportEmployeeReport: async (filter: EmployeeReportFilter, format: "excel" | "pdf") => {
        try {
            const response = await axiosInstance.post(
                `/reports/employees/export?format=${format}`,
                {
                    // Mapping filter từ UI sang DTO Backend
                    department: filter.department,
                    subTeam: filter.subTeam,
                    searchTerm: filter.searchTerm,
                    hireDateFrom: filter.hireDateFrom,
                    hireDateTo: filter.hireDateTo,
                    selectedStatuses: filter.selectedStatuses
                },
                {
                    responseType: "blob", // Quan trọng: Để nhận về file binary
                }
            );

            // Tạo link tải xuống ảo và kích hoạt nó
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;

            // Đặt tên file tải về
            const extension = format === "excel" ? "csv" : "pdf";
            const dateStr = new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD
            link.setAttribute("download", `Employee_Report_${dateStr}.${extension}`);

            document.body.appendChild(link);
            link.click();

            // Dọn dẹp
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            throw error;
        }
    },
};