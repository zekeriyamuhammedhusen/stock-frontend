import api from './apiConfig';

export const getCredits = async (params = {}) => api.get('/credits', { params });
export const getCredit = async (id) => api.get(`/credits/${id}`);
export const createCredit = async (payload) => api.post('/credits', payload);
export const updateCredit = async (id, payload) => api.put(`/credits/${id}`, payload);
export const deleteCredit = async (id) => api.delete(`/credits/${id}`);
export const recordCreditPayment = async (id, payload) => api.post(`/credits/${id}/payment`, payload);
