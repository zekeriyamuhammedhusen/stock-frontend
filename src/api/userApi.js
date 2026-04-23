    import api from './apiConfig';

    export const getUsers = async (params = {}) => {
    return await api.get('/users', { params });
    };

    export const getUser = async (id) => {
    return await api.get(`/users/${id}`);
    };

    export const getMe = async () => {
        return await api.get('/users/me');
    };

    export const createUser = async (userData) => {
    return await api.post('/users', userData);
    };

    export const updateUser = async (id, userData) => {
    return await api.put(`/users/${id}`, userData);
    };

    export const deleteUser = async (id) => {
    return await api.delete(`/users/${id}`);
    };

    export const activateUser = async (id) => {
    return await api.post(`/users/${id}/activate`);
    };

    export const deactivateUser = async (id) => {
    return await api.post(`/users/${id}/deactivate`);
    };

    export const grantUserRole = async (id, roleId) => {
    return await api.post(`/users/${id}/roles/grant`, { roleId });
    };

    export const revokeUserRole = async (id, roleId) => {
    return await api.post(`/users/${id}/roles/revoke`, { roleId });
    };

    export const grantUserPermission = async (id, permissionId) => {
    return await api.post(`/users/${id}/permissions/grant`, { permissionId });
    };

    export const revokeUserPermission = async (id, permissionId) => {
    return await api.post(`/users/${id}/permissions/revoke`, { permissionId });
    };