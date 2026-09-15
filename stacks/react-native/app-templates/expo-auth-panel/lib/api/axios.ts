import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const baseURL = process.env['EXPO_PUBLIC_API_URL'] ?? '';
const accountHeader = process.env['EXPO_PUBLIC_ACCOUNT_HEADER'] ?? '';

export const api = axios.create({
  baseURL,
  allowAbsoluteUrls: false,
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const path = String(config.url ?? '');
  const guest =
    path.includes('/auth/login') ||
    path.includes('/auth/two-factor') ||
    path.includes('/auth/refresh');
  if (!guest) {
    const token = await SecureStore.getItemAsync('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  if (accountHeader) {
    const account = await SecureStore.getItemAsync('account_uuid');
    if (account) config.headers[accountHeader] = account;
  }
  return config;
});
