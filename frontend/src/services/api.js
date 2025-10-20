import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    withCredentials: true, // Important for session cookies
    headers: {
        'Content-Type': 'application/json'
    }
});

// Course APIs
export const searchCourses = async (courseName) => {
    const response = await api.post('/courses/search', { courseName });
    return response.data;
};

export const addCourse = async (course, section = null) => {
    const response = await api.post('/courses/add', { course, section });
    return response.data;
};

export const removeCourse = async (course, section = null) => {
    const response = await api.post('/courses/remove', { course, section });
    return response.data;
};

export const getBasket = async () => {
    const response = await api.get('/courses/basket');
    return response.data;
};

export const clearBasket = async () => {
    const response = await api.delete('/courses/basket/clear');
    return response.data;
};

// Schedule APIs
export const generateSchedule = async () => {
    const response = await api.post('/schedule/generate');
    return response.data;
};

export default api;