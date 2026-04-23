import api from './apiConfig';

export const getApprovalRequests = async (params = {}) => api.get('/approvals', { params });
export const approveApprovalRequest = async (id, note = '') => api.post(`/approvals/${id}/approve`, { note });
export const rejectApprovalRequest = async (id, note = '') => api.post(`/approvals/${id}/reject`, { note });
