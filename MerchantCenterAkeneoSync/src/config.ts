const API_URL = process.env.REACT_APP_API_URL || '/api';

export const getApiUrl = (): string => {
  return API_URL;
};

export const API_ENDPOINTS = {
  SERVICE: '/service',
} as const; 