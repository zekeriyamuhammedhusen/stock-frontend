    import api from './apiConfig';

    export const getRoles = async (params = {}) => {
        return await api.get('/roles', { params });
    };

    export const getRole = async (id) => {
    return await api.get(`/roles/${id}`);
    };

    export const createRole = async (roleData) => {
    return await api.post('/roles', roleData);
    };

    export const updateRole = async (id, roleData) => {
    return await api.put(`/roles/${id}`, roleData);
    };

    export const deleteRole = async (id) => {
    return await api.delete(`/roles/${id}`);
    };

    export const activateRole = async (id) => {
    return await api.post(`/roles/${id}/activate`);
    };

    export const deactivateRole = async (id) => {
    return await api.post(`/roles/${id}/deactivate`);
    };

    export const assignRole = async (userId, roleName) => {
    return await api.post('/roles/assign', { userId, roleName });
    };