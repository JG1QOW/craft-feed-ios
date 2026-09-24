import { API_V1, DEVICE_NAME } from '../config';
import type { Feed, FeedStatus, ItemsResponse, Language, TokenResponse, User } from './types';

export class ApiError extends Error {
  status: number;
  errors: Record<string, string[]> | undefined;

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: Method;
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | boolean | undefined>;
}

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, query } = options;

  let url = `${API_V1}${path}`;
  if (query) {
    const params = Object.entries(query)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (params) url += `?${params}`;
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && token && onUnauthorized) onUnauthorized();
    const payload = (data ?? {}) as { message?: string; error?: string; errors?: Record<string, string[]> };
    throw new ApiError(
      response.status,
      payload.message ?? payload.error ?? `HTTP ${response.status}`,
      payload.errors,
    );
  }

  return data as T;
}

export const auth = {
  login: (email: string, password: string) =>
    request<TokenResponse>('/auth/login', {
      method: 'POST',
      body: { email, password, device_name: DEVICE_NAME },
    }),
  register: (name: string, email: string, password: string, passwordConfirmation: string) =>
    request<TokenResponse>('/auth/register', {
      method: 'POST',
      body: {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
        device_name: DEVICE_NAME,
      },
    }),
  forgotPassword: (email: string) =>
    request<{ message?: string }>('/auth/forgot-password', { method: 'POST', body: { email } }),
  me: (token: string) => request<{ user: User }>('/auth/me', { token }).then((r) => r.user),
  logout: (token: string) => request<{ message?: string }>('/auth/logout', { method: 'POST', token }),
};

export const account = {
  destroy: (token: string, password: string) =>
    request<{ message?: string }>('/account', { method: 'DELETE', token, body: { password } }),
  updateProfile: (token: string, data: { name: string; email: string; language: Language }) =>
    request<{ success: boolean; user: User }>('/profile', { method: 'POST', token, body: data }),
};

export const feeds = {
  list: (token: string) => request<Feed[]>('/feeds', { token }),
  updateStatus: (token: string, uuid: string, status: FeedStatus) =>
    request<{ success: boolean; error?: string }>('/feeds/status', {
      method: 'PATCH',
      token,
      body: { uuid, status },
    }),
  destroy: (token: string, uuid: string) =>
    request<{ success: boolean; error?: string }>('/feeds', { method: 'DELETE', token, body: { uuid } }),
};

export const items = {
  list: (token: string, params: { offset?: number; limit?: number; showOnlyUnread?: boolean }) =>
    request<ItemsResponse>('/items', {
      token,
      query: {
        offset: params.offset ?? 0,
        limit: params.limit ?? 50,
        show_only_unread: params.showOnlyUnread ? 'true' : 'false',
      },
    }),
  markRead: (
    token: string,
    body: { feed_uuid: string; item_url: string; item_title?: string; unread?: boolean },
  ) => request<{ success: boolean }>('/items/mark-read', { method: 'POST', token, body }),
};
