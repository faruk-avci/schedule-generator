import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.ozuplanner.com';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const AdminAPI = {
    // Auth
    login: (password) => api.post('/api/admin/login', { password }),
    logout: () => api.post('/api/admin/logout'),
    checkAuth: () => api.get('/api/admin/check'),

    // Analytics
    getLogs: () => api.get('/api/admin/logs'),
    getSessions: () => api.get('/api/admin/sessions'),

    // Settings
    getSettings: () => api.get('/api/admin/settings'),
    updateSetting: (key, value) => api.put(`/api/admin/settings/${key}`, { value }),

    // Courses
    getCourses: (search = '', limit = 50, offset = 0) =>
        api.get('/api/admin/courses', { params: { search, limit, offset } }),

    // Course CRUD (Stubs for now)
    addCourse: (data) => api.post('/api/admin/courses', data),
    updateCourse: (id, data) => api.put(`/api/admin/courses/${id}`, data),
    deleteCourse: (id) => api.delete(`/api/admin/courses/${id}`)
};

export default AdminAPI;
