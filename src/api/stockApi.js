import api from './apiConfig';

export const getInventory = async (params = {}) => api.get('/stock/inventory', { params });
export const getStockTransactions = async (params = {}) => api.get('/stock/transactions', { params });
export const stockIn = async (payload) => api.post('/stock/in', payload);
export const stockOut = async (payload) => api.post('/stock/out', payload);
