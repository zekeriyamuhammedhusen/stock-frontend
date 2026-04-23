import { getToken } from './token';

const AUTH_PERMISSIONS_KEY = 'authPermissions';

export const getTokenRoles = () => {
  const token = getToken();
  if (!token) return [];

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return Array.isArray(payload.roles)
      ? payload.roles.map((role) => String(role).toLowerCase())
      : [];
  } catch {
    return [];
  }
};

export const isAdminRole = () => getTokenRoles().includes('admin');

export const getStoredPermissions = () => {
  const raw = sessionStorage.getItem(AUTH_PERMISSIONS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const setStoredPermissions = (permissions) => {
  sessionStorage.setItem(AUTH_PERMISSIONS_KEY, JSON.stringify(Array.from(new Set(permissions))));
};

export const clearStoredPermissions = () => {
  sessionStorage.removeItem(AUTH_PERMISSIONS_KEY);
};

export const extractPermissionNames = (user) => {
  const direct = (user?.permissions || [])
    .map((permission) => permission?.name)
    .filter(Boolean)
    .map((name) => String(name).toLowerCase());

  return Array.from(new Set(direct));
};

export const hasAnyPermission = (requiredPermissions = [], currentPermissions = getStoredPermissions()) => {
  if (!Array.isArray(requiredPermissions) || requiredPermissions.length === 0) return true;
  const normalized = currentPermissions.map((permission) => String(permission).toLowerCase());
  return requiredPermissions.some((permission) => normalized.includes(String(permission).toLowerCase()));
};
