import axios from 'axios';

const JAVA_API_BASE_URL = 'http://localhost:8081/api';

export const utilityApi = {
    // Calendar Events
    getCalendarEvents: async (userId: number) => {
        const response = await fetch(`${JAVA_API_BASE_URL}/calendar/events?userId=${userId}`);
        if (!response.ok) throw new Error("Failed to fetch events");
        return response.json();
    },

    createCalendarEvent: async (event: any) => {
        const response = await fetch(`${JAVA_API_BASE_URL}/calendar/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(event)
        });
        if (!response.ok) throw new Error("Failed to create event");
        return response.json();
    },

    deleteCalendarEvent: async (id: number) => {
        const response = await fetch(`${JAVA_API_BASE_URL}/calendar/events/${id}`, {
            method: "DELETE"
        });
        if (!response.ok) throw new Error("Failed to delete event");
    },

    // Holidays
    getHolidays: async () => {
        const response = await axios.get(`${JAVA_API_BASE_URL}/holidays`);
        return response.data;
    },

    createHoliday: async (holiday: any) => {
        const response = await axios.post(`${JAVA_API_BASE_URL}/holidays`, holiday);
        return response.data;
    },

    deleteHoliday: async (id: number) => {
        await axios.delete(`${JAVA_API_BASE_URL}/holidays/${id}`);
    },

    // Documents
    generateLeavePdf: async (data: any) => {
        const response = await axios.post(`${JAVA_API_BASE_URL}/documents/generate/leave-pdf`, data, {
            responseType: 'blob',
        });

        // Format filename: <Employee Name>_Leave Application_<DD/MM/YY>
        const employeeName = (data.employeeName || 'Employee').replace(/\s+/g, '_');
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = String(today.getFullYear()).slice(-2);
        const dateStr = `${day}-${month}-${year}`;
        const filename = `${employeeName}_Leave_Application_${dateStr}.pdf`;

        // Create a download link for the PDF
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
    }
};
