    import api from './apiConfig';

    export const getPermissions = async (params = {}) => {
        return await api.get('/permissions', { params });
    };

     export const getPermission = async (id) => {
        return await api.get(`/permissions/${id}`);
        };
    

    export const createPermission = async (permissionData) => {
    return await api.post('/permissions', permissionData);
    };

    export const updatePermission = async (id, permissionData) => {
    return await api.put(`/permissions/${id}`, permissionData);
    };

    export const deletePermission = async (id) => {
    return await api.delete(`/permissions/${id}`);
    };

    export const activatePermission = async (id) => {
    return await api.post(`/permissions/${id}/activate`);
    };

    export const deactivatePermission = async (id) => {
    return await api.post(`/permissions/${id}/deactivate`);
    };