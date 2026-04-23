import api from './apiConfig';

export const getCategories = async (params = {}) => api.get('/categories', { params });
export const createCategory = async (payload) => api.post('/categories', payload);
export const updateCategory = async (id, payload) => api.put(`/categories/${id}`, payload);
export const deleteCategory = async (id) => api.delete(`/categories/${id}`);
export const activateCategory = async (id) => api.post(`/categories/${id}/activate`);
export const deactivateCategory = async (id) => api.post(`/categories/${id}/deactivate`);

export const getUnits = async (params = {}) => api.get('/units', { params });
export const createUnit = async (payload) => api.post('/units', payload);
export const updateUnit = async (id, payload) => api.put(`/units/${id}`, payload);
export const deleteUnit = async (id) => api.delete(`/units/${id}`);
export const activateUnit = async (id) => api.post(`/units/${id}/activate`);
export const deactivateUnit = async (id) => api.post(`/units/${id}/deactivate`);

export const getWarehouses = async (params = {}) => api.get('/warehouses', { params });
export const createWarehouse = async (payload) => api.post('/warehouses', payload);
export const updateWarehouse = async (id, payload) => api.put(`/warehouses/${id}`, payload);
export const deleteWarehouse = async (id) => api.delete(`/warehouses/${id}`);
export const activateWarehouse = async (id) => api.post(`/warehouses/${id}/activate`);
export const deactivateWarehouse = async (id) => api.post(`/warehouses/${id}/deactivate`);
