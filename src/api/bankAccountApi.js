import api from './apiConfig';

export const getBankAccounts = async (params = {}) => api.get('/bank-accounts', { params });
export const getBankAccount = async (id) => api.get(`/bank-accounts/${id}`);
export const createBankAccount = async (payload) => api.post('/bank-accounts', payload);
export const updateBankAccount = async (id, payload) => api.put(`/bank-accounts/${id}`, payload);
export const deleteBankAccount = async (id) => api.delete(`/bank-accounts/${id}`);
export const activateBankAccount = async (id) => api.post(`/bank-accounts/${id}/activate`);
export const deactivateBankAccount = async (id) => api.post(`/bank-accounts/${id}/deactivate`);
