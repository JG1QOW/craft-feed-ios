import { ApiError } from '../api/client';

export function errorMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError) {
    if (e.errors) {
      const first = Object.values(e.errors).flat()[0];
      if (first) return first;
    }
    return e.message || fallback;
  }
  if (e instanceof TypeError) return fallback;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
