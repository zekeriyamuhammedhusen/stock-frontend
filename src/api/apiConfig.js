    import axios from 'axios';
    import { getToken, removeToken } from '../utils/token';
    import { clearStoredPermissions } from '../utils/authAccess';
    import { toast } from 'react-toastify';
    import {
        clearSessionTracking,
        isSessionInactiveForTimeout,
        touchSessionActivity,
    } from '../utils/sessionTimeout';

    const rawApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();
    const normalizedApiBaseUrl = rawApiBaseUrl
        ? (rawApiBaseUrl.endsWith('/api')
            ? rawApiBaseUrl
            : `${rawApiBaseUrl.replace(/\/+$/, '')}/api`)
        : 'http://localhost:5000/api';

    const api = axios.create({
    baseURL: normalizedApiBaseUrl,
    headers: { 'Content-Type': 'application/json' },
    });

    api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
            touchSessionActivity();
    }
    return config;
    });

    api.interceptors.response.use(
        (response) => response,
        (error) => {
            const status = error?.response?.status;
            const apiErrorMessage = String(error?.response?.data?.error || error?.response?.data?.message || '').toLowerCase();
            const requestUrl = error?.config?.url || '';

            // Do not force redirect for failed login attempts.
            const isLoginRequest = requestUrl.includes('/auth/login');
            const shouldRedirectToLogin =
                !isLoginRequest &&
                (status === 401 || apiErrorMessage.includes('invalid token') || apiErrorMessage.includes('jwt expired'));

            if (shouldRedirectToLogin) {
                const showInactivityToast = isSessionInactiveForTimeout();
                removeToken();
                clearStoredPermissions();
                clearSessionTracking();
                if (showInactivityToast && sessionStorage.getItem('authToastShown') !== '1') {
                    toast.error('Your session expired. Please log in again.');
                    sessionStorage.setItem('authToastShown', '1');
                }
                if (window.location.pathname !== '/') {
                    window.location.href = '/';
                }
            }

            return Promise.reject(error);
        }
    );

    export default api;