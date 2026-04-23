import api from './apiConfig';

export const getTransfers = async (params = {}) => api.get('/transfers', { params });
export const getTransferSourceWarehouses = async (productId) =>
  api.get('/transfers/source-warehouses', { params: { productId } });
export const createTransfer = async (payload) => api.post('/transfers', payload);
export const updateTransferStatus = async (id, status) =>
  api.patch(`/transfers/${id}/status`, { status });
