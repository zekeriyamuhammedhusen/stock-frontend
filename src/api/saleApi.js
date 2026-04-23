import api from './apiConfig';

export const getSales = async (params = {}) => api.get('/sales', { params });
export const getSalesSummary = async (params = {}) => api.get('/sales/summary', { params });
export const getSaleSourceWarehouses = async (productId) =>
	api.get('/sales/source-warehouses', { params: { productId } });
export const createSale = async (payload) => api.post('/sales', payload);
