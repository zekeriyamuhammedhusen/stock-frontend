import api from './apiConfig';

export const getDashboardMetrics = async () => api.get('/reports/dashboard-metrics');
export const getLowStockReport = async (params = {}) => api.get('/reports/low-stock', { params });
export const getProfitLossReport = async (params = {}) => api.get('/reports/profit-loss', { params });
export const getSalesReport = async (params = {}) => api.get('/reports/sales', { params });
export const getSupplierPerformanceReport = async (params = {}) => api.get('/reports/supplier-performance', { params });
