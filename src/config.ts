import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as { apiUrl?: string; googleIosClientId?: string };

export const API_BASE_URL: string = (
  process.env.EXPO_PUBLIC_API_URL ??
  extra.apiUrl ??
  'https://craft-feed.com'
).replace(/\/+$/, '');

export const API_V1 = `${API_BASE_URL}/api/v1`;

export const DEVICE_NAME = 'iOS App';

export const GOOGLE_IOS_CLIENT_ID: string | undefined =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? extra.googleIosClientId ?? undefined;
