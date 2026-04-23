import api from './apiConfig';

export const getPurchaseOrders = async (params = {}) => api.get('/purchase-orders', { params });
export const getPurchaseOrder = async (id) => api.get(`/purchase-orders/${id}`);
export const createPurchaseOrder = async (payload) => api.post('/purchase-orders', payload);
export const updatePurchaseOrderStatus = async (id, payload) =>
  api.patch(`/purchase-orders/${id}/status`, payload);
