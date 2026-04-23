export const isMissingPermissionError = (error) => {
  const message = String(error?.response?.data?.error || error?.response?.data?.message || '').toLowerCase();
  return error?.response?.status === 403 && message.includes('missing permission');
};
