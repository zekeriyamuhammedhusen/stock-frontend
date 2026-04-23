const SESSION_ACTIVITY_KEY = 'lastActivityAt';
const SESSION_ELIGIBLE_KEY = 'sessionExpiryEligible';

export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;

export const markSessionLogin = () => {
  sessionStorage.setItem(SESSION_ELIGIBLE_KEY, '1');
  localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
};

export const clearSessionTracking = () => {
  sessionStorage.removeItem(SESSION_ELIGIBLE_KEY);
  localStorage.removeItem(SESSION_ACTIVITY_KEY);
};

export const isSessionEligibleForExpiryToast = () => sessionStorage.getItem(SESSION_ELIGIBLE_KEY) === '1';

export const touchSessionActivity = () => {
  if (!isSessionEligibleForExpiryToast()) {
    return;
  }

  localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
};

export const isSessionInactiveForTimeout = () => {
  if (!isSessionEligibleForExpiryToast()) {
    return false;
  }

  const lastActivityAt = Number(localStorage.getItem(SESSION_ACTIVITY_KEY));
  if (!Number.isFinite(lastActivityAt) || lastActivityAt <= 0) {
    localStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
    return false;
  }

  return Date.now() - lastActivityAt >= INACTIVITY_TIMEOUT_MS;
};