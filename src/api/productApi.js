import api from './apiConfig';

export const getProducts = async (params = {}) => api.get('/products', { params });
export const getProduct = async (id) => api.get(`/products/${id}`);
export const createProduct = async (payload) => api.post('/products', payload);
export const updateProduct = async (id, payload) => api.put(`/products/${id}`, payload);
export const deleteProduct = async (id) => api.delete(`/products/${id}`);
export const activateProduct = async (id) => api.post(`/products/${id}/activate`);
export const deactivateProduct = async (id) => api.post(`/products/${id}/deactivate`);
