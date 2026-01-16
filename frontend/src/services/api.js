import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

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

export const setMajor = async (major) => {
    const response = await api.post('/courses/major', { major });
    return response.data;
};

// Schedule APIs
export const generateSchedule = async (limit = null, preference = null) => {
    const payload = {};
    if (limit) payload.limit = limit;
    if (preference) payload.preference = preference;

    const response = await api.post('/schedule/generate', payload);
    return response.data;
};

// Site Settings APIs
export const getTermInfo = async () => {
    const response = await api.get('/courses/term');
    return response.data;
};

// Basket APIs
export const saveBasket = async (name) => {
    try {
        const response = await api.post('/courses/baskets/save', { name });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const getSavedBaskets = async () => {
    try {
        const response = await api.get('/courses/baskets');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const loadBasket = async (name) => {
    try {
        const response = await api.post('/courses/baskets/load', { name });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const removeSavedBasket = async (name) => {
    try {
        const response = await api.post('/courses/baskets/remove', { name });
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Analytics APIs
export const logPageView = async (page) => {
    try {
        const response = await api.post('/logs/view', { page });
        return response.data;
    } catch (error) {
        console.error('Failed to log page view:', error);
        return { success: false };
    }
};

export const logEvent = async (eventName, details = {}) => {
    try {
        const response = await api.post('/logs/event', { eventName, details });
        return response.data;
    } catch (error) {
        return { success: false };
    }
};

export const logError = async (error, stack = '', url = window.location.href) => {
    try {
        const response = await api.post('/logs/error', { error, stack, url });
        return response.data;
    } catch (err) {
        return { success: false };
    }
};

export default api;