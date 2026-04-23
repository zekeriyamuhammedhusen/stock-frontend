import api from './apiConfig';

export const getPurchases = async (params = {}) => api.get('/purchases', { params });
export const createPurchase = async (payload) => api.post('/purchases', payload);
