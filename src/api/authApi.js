    import api from './apiConfig';

    export const login = async (credentials) => {
    return await api.post('/auth/login', credentials);
    };

    export const forgotPassword = async (payload) => {
        return await api.post('/auth/forgot-password', payload);
    };

    export const resetPassword = async (payload) => {
        return await api.post('/auth/reset-password', payload);
    };

    export const logout = async () => {
    return await api.post('/auth/logout');
    };