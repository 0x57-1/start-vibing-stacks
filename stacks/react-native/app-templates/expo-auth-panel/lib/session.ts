import * as SecureStore from 'expo-secure-store';

const ACCESS = 'access_token';
const REFRESH = 'refresh_token';
const ACCOUNT = 'account_uuid';

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS);
}

export async function setSession(opts: {
  accessToken: string;
  refreshToken: string;
  accountUuid?: string;
}): Promise<void> {
  await SecureStore.setItemAsync(ACCESS, opts.accessToken);
  await SecureStore.setItemAsync(REFRESH, opts.refreshToken);
  if (opts.accountUuid) await SecureStore.setItemAsync(ACCOUNT, opts.accountUuid);
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS);
  await SecureStore.deleteItemAsync(REFRESH);
  await SecureStore.deleteItemAsync(ACCOUNT);
}
